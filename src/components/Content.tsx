import { useEffect, useMemo, useRef } from 'react';
import { PixelRatio, Platform, View } from 'react-native';
import Animated, {
  SensorType,
  type SharedValue,
  useAnimatedSensor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { Canvas, useGPUContext } from 'react-native-wgpu';
import * as d from 'typegpu/data';
import type {
  TextureProps,
  TgpuRenderPipeline,
  TgpuRoot,
  TgpuTexture,
} from 'typegpu';
import {
  bufferData,
  type BufferData,
  textureBindGroupLayout,
} from '../shaders/bindGroupLayouts';
import { TypedBufferMap } from '../shaders/resourceManagement/bufferManager';
import {
  createColorMaskBindGroup,
  createGlareBindGroup,
  createRotationValuesBindGroup,
} from '../shaders/bindGroupUtils';
import colorMaskFragment from '../shaders/fragmentShaders/colorMaskFragment';
import { newGlareFragment } from '../shaders/fragmentShaders/glareFragment';
import {
  attachBindGroups,
  blend,
  createMaskPipeline,
  createRainbowHoloPipeline as createHoloPipeline,
  createReverseHoloPipeline,
  getDefaultTarget,
} from '../shaders/pipelineSetups';
import mainVertex from '../shaders/vertexShaders/mainVertex';
import { subscribeToOrientationChange } from '../shaders/utils';
import type {
  ColorAttachment,
  ColorMask,
  DeepPartiallyOptional,
  GlareOptions,
  PipelineAttachmentPair,
} from '../types/types';
import {
  colorMaskToTyped,
  createColorMask,
  createGlareOptions,
} from '../types/typeUtils';
import type { V2d, V3d } from '../types/vector';
import {
  addV3d,
  clampV3d,
  componentsFromV3d,
  degToRad,
  divV3d,
  negateV2dY,
  rotateV2d,
  scaleV2d,
  scaleV3d,
  subtractV3d,
  transformV2d,
  zeroV3d,
} from '../utils/vector';

export interface SharedProps {
  width: number;
  height: number;
  glareOptions?: Partial<GlareOptions>;
  colorMaskOptions?: DeepPartiallyOptional<ColorMask, 'baseColor'>;
  useTouchControl?: boolean;
  touchPosition?: SharedValue<V2d>;
  addTextureMask?: boolean;
  addReverseHolo?: boolean;
  addHolo?: boolean;
}

interface ContentProps extends SharedProps {
  root: TgpuRoot;
  imageTexture: TgpuTexture<TextureProps>;
  maskTexture?: TgpuTexture<TextureProps>;
}

interface PipelineMap {
  glare: TgpuRenderPipeline;
  colorMask: TgpuRenderPipeline;
  mask: TgpuRenderPipeline | void;
  reverseHolo: TgpuRenderPipeline | void;
  holo: TgpuRenderPipeline | void;
}

export default function Content({
  addHolo,
  addReverseHolo,
  addTextureMask,
  colorMaskOptions,
  glareOptions,
  height,
  imageTexture,
  maskTexture,
  root,
  touchPosition,
  useTouchControl,
  width,
}: ContentProps) {
  const { device } = root;
  const { ref, context } = useGPUContext();
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const frameRef = useRef<number>(null);

  //changing canvas size to prevent blur
  const pixelRatio = PixelRatio.get();
  const size = { x: width, y: height };
  const pixelSize = transformV2d(scaleV2d(size, pixelRatio), (v) =>
    Math.max(1, Math.round(v))
  );

  const landscape = useSharedValue<boolean>(false);
  const rotation = useSharedValue<V3d>(zeroV3d); // final GPU offsets

  // Calibration shared values (UI thread)
  const initialGravity = useSharedValue<V3d>(zeroV3d);
  const calibSum = useSharedValue<V3d>(zeroV3d);
  const calibCount = useSharedValue<number>(0);
  const calibrated = useSharedValue<boolean>(false);
  const gravitySensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });

  const bufferMap = useMemo(
    () => new TypedBufferMap<BufferData>(bufferData),
    []
  );

  //TODO: add once again, when the wgpu issues are fixed :3

  const animatedStyle = useAnimatedStyle(() => {
    // const rotX = rotationShared.value.x * 10;
    // const rotY = rotationShared.value.y * 10;

    return {
      transform: [
        { perspective: 300 },
        // { rotateX: `${-rotX}deg` },
        // { rotateY: `${rotY}deg` },
        // { rotateZ: `${rotX * 5}deg` },
      ],
    };
  });
  // Subscribe to orientation changes and reset calibration on change
  useEffect(
    () =>
      subscribeToOrientationChange((isLandscape) => {
        landscape.value = isLandscape;
      }),
    [landscape]
  );

  // Calibration & mapping logic
  useDerivedValue(() => {
    'worklet';

    if (useTouchControl) {
      rotation.value = touchPosition
        ? { x: touchPosition.value.x, y: touchPosition.value.y, z: 0 }
        : zeroV3d;

      return;
    }

    const g = gravitySensor.sensor.value;
    const CALIBRATION_SAMPLES = 40;
    const alpha = 0.15; // smoothing
    const scale = 0.6;

    if (!calibrated.value) {
      // accumulate baseline in device coordinates
      calibSum.value = addV3d(calibSum.value, g);

      if (++calibCount.value >= CALIBRATION_SAMPLES) {
        initialGravity.value = divV3d(calibSum.value, calibCount.value);
        calibrated.value = true;
      }

      rotation.value = zeroV3d;
      return;
    }

    const init = initialGravity.value;
    const dg = subtractV3d(g, init);

    // Rotate into screen coordinates so offsets auto-swap with orientation
    const m = rotateV2d(dg, degToRad(-90 * Number(landscape.value)));
    const screen = negateV2dY(m);
    const smoothOffset = { ...scaleV2d(screen, alpha), z: dg.z * alpha };
    const smooth = scaleV3d(
      addV3d(scaleV3d(rotation.value, 1 - alpha), smoothOffset),
      scale
    );

    rotation.value = clampV3d(
      landscape.value
        ? {
            x: smooth.y,
            y: -smooth.x,
            z: smooth.z,
          }
        : smooth,
      -1,
      1
    );
  });

  // Render loop
  useEffect(() => {
    if (!context) return;

    //this sets the underlying resolution of the canvas to prevent blurriness
    const canvasElement = context.canvas;

    if (
      canvasElement.width !== pixelSize.x &&
      canvasElement.height !== pixelSize.y
    ) {
      canvasElement.width = pixelSize.x;
      canvasElement.height = pixelSize.y;
    }

    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const imageTextureBindGroup = root.createBindGroup(textureBindGroupLayout, {
      texture: root.unwrap(imageTexture).createView(),
      sampler,
    });

    const rotationBuffer = bufferMap.addBuffer(root, 'rotation', d.vec3f(0.0));

    const rotationBindGroup = createRotationValuesBindGroup(
      root,
      rotationBuffer
    );

    const glareBuffer = bufferMap.addBuffer(
      root,
      'glare',
      createGlareOptions(glareOptions ?? {})
    );
    const glareBindGroup = createGlareBindGroup(root, glareBuffer);

    const colorMaskBuffer = bufferMap.addBuffer(
      root,
      'colorMask',
      colorMaskToTyped(
        createColorMask(colorMaskOptions ?? { baseColor: [-20, -20, -20] })
      )
    );
    const colorMaskBindGroup = createColorMaskBindGroup(root, colorMaskBuffer);

    const pipelineMap: PipelineMap = {
      glare: attachBindGroups(
        root['~unstable']
          .withVertex(mainVertex, {})
          .withFragment(newGlareFragment, getDefaultTarget(presentationFormat))
          .createPipeline(),
        [
          imageTextureBindGroup,
          rotationBindGroup,
          glareBindGroup,
          colorMaskBindGroup,
        ]
      ),
      colorMask: attachBindGroups(
        root['~unstable']
          .withVertex(mainVertex, {})
          .withFragment(
            colorMaskFragment,
            getDefaultTarget(presentationFormat, blend)
          )
          .createPipeline(),
        [imageTextureBindGroup, colorMaskBindGroup, rotationBindGroup]
      ),
      mask: createMaskPipeline(
        root,
        maskTexture,
        [imageTextureBindGroup, rotationBindGroup],
        sampler,
        presentationFormat
      ),
      reverseHolo: createReverseHoloPipeline(
        root,
        maskTexture,
        [imageTextureBindGroup, rotationBindGroup, glareBindGroup],
        sampler,
        presentationFormat
      ),
      holo: createHoloPipeline(
        root,
        imageTexture,
        [rotationBindGroup],
        sampler,
        presentationFormat
      ),
    };

    const modifyBuffers = () => {
      rotationBuffer.write(d.vec3f(...componentsFromV3d(rotation.value)));
    };

    const renderPipelines = () => {
      const view = context.getCurrentTexture().createView();
      const initialAttachment: ColorAttachment = {
        view,
        clearValue: [0, 0, 0, 0],
        loadOp: 'clear',
        storeOp: 'store',
      };
      const loadingAttachment: ColorAttachment = {
        view,
        clearValue: [0, 0, 0, 0],
        loadOp: 'load',
        storeOp: 'store',
      };

      const { glare, mask, colorMask, holo, reverseHolo } = pipelineMap;

      const pairs: PipelineAttachmentPair[] = [[glare, initialAttachment]];

      if (addTextureMask && mask) pairs.push([mask, loadingAttachment]);
      if (addReverseHolo && reverseHolo)
        pairs.push([reverseHolo, loadingAttachment]);
      if (addHolo && holo) pairs.push([holo, loadingAttachment]);
      pairs.push([colorMask, loadingAttachment]);

      pairs.forEach(([pipeline, attachment]) =>
        pipeline.withColorAttachment(attachment).draw(6)
      );
    };

    const presentContext = () => context.present();

    const render = () => {
      modifyBuffers();
      renderPipelines();
      presentContext();
      frameRef.current = requestAnimationFrame(render);
    };
    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [
    device,
    context,
    root,
    presentationFormat,
    imageTexture,
    maskTexture,
    rotation,
    bufferMap,
    glareOptions,
    colorMaskOptions,
    addHolo,
    addReverseHolo,
    addTextureMask,
    pixelSize,
  ]);

  return (
    <Animated.View style={[animatedStyle]}>
      <View
        style={
          [
            // styles.container,
            // { width, height },
          ]
        }
      >
        <Canvas
          ref={ref}
          style={[
            { width, height },
            // aspectRatio: pixelWidth / pixelHeight,
            // { transform: [{ scaleX: 1 / dpr }, { scaleY: 1 / dpr }] },
          ]}
          transparent={Platform.OS === 'ios'}
          // transparent={true}
        />
      </View>
    </Animated.View>
  );
}

// const styles = StyleSheet.create({
//   container: { overflow: 'hidden' },
// });
