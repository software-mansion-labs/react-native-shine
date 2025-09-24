import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useDevice, useGPUContext } from 'react-native-wgpu';
import { getOrInitRoot } from '../roots';
import mainVertex from '../shaders/vertexShaders/mainVertex';
import getBitmapFromURI from '../shaders/resourceManagement/bitmaps';
import {
  subscribeToOrientationChange,
  getAngleFromDimensions,
} from '../shaders/utils';
import type { TgpuRenderPipeline, TgpuTexture } from 'typegpu';
import {
  textureBindGroupLayout,
  type BufferDataMap,
  bufferData,
} from '../shaders/bindGroupLayouts';
import Animated, {
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import * as d from 'typegpu/data';
import { PixelRatio, Platform, View } from 'react-native';
import {
  createGlareOptionsBindGroup,
  createColorMaskBindGroup,
  createRotationValuesBindGroup,
} from '../shaders/bindGroupUtils';
import {
  createGlareOptions,
  createColorMask,
  colorMaskToTyped,
} from '../types/typeUtils';
import type { V2d, V3d } from '../types/vector';
import type {
  GlareOptions,
  ColorMask,
  DeepPartiallyOptional,
  ColorAttachment,
} from '../types/types';
import {
  attachBindGroups,
  blend,
  createReverseHoloPipeline,
  createMaskPipeline,
  getDefaultTarget,
  pipelineRenderFunction,
  createRainbowHoloPipeline as createHoloPipeline,
} from '../shaders/pipelineSetups';
import colorMaskFragment from '../shaders/fragmentShaders/colorMaskFragment';
import {
  createTexture,
  loadTexture,
} from '../shaders/resourceManagement/textures';
import { newGlareFragment } from '../shaders/fragmentShaders/glareFragment';
import { TypedBufferMap } from '../shaders/resourceManagement/bufferManager';
import {
  addV3d,
  divV3d,
  subtractV3d,
  componentsFromV3d,
  zeroV3d,
  negateV2dY,
  scaleV2d,
  scaleV3d,
  clampV3d,
  degToRad,
  rotateV2d,
} from '../utils/vector';

export interface ShineProps {
  width: number;
  height: number;
  imageURI: string;
  glareOptions?: Partial<GlareOptions>;
  colorMaskOptions?: DeepPartiallyOptional<ColorMask, 'baseColor'>;
  maskURI?: string;
  useTouchControl?: boolean;
  touchPosition?: SharedValue<V2d>;
  addTextureMask?: boolean;
  addReverseHolo?: boolean;
  addHolo?: boolean;
}

export function Shine({
  width,
  height,
  imageURI,
  glareOptions,
  colorMaskOptions,
  maskURI,
  touchPosition,
  useTouchControl = false,
  addTextureMask = false,
  addHolo = false,
  addReverseHolo = false,
}: ShineProps) {
  const { device } = useDevice();
  const root = device && getOrInitRoot(device);
  const { ref, context } = useGPUContext();
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const frameRef = useRef<number>(null);

  //changing canvas size to prevent blur
  const dpr = PixelRatio.get();
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));

  const [imageTexture, setImageTexture] = useState<TgpuTexture>();
  const [maskTexture, setMaskTexture] = useState<TgpuTexture>();

  const orientationAngle = useSharedValue<number>(0); // degrees
  const rotationShared = useSharedValue<V3d>(zeroV3d); // final GPU offsets

  // Calibration shared values (UI thread)
  const initialGravity = useSharedValue<V3d>(zeroV3d);
  const calibSum = useSharedValue<V3d>(zeroV3d);
  const calibCount = useSharedValue<number>(0);
  const calibrated = useSharedValue<boolean>(false);
  const gravitySensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });

  const bufferManager = useMemo(
    () => new TypedBufferMap<BufferDataMap>(bufferData),
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
  useEffect(() => {
    orientationAngle.value = getAngleFromDimensions();

    return subscribeToOrientationChange((angleDeg) => {
      orientationAngle.value = angleDeg;
    });
  }, [orientationAngle]);

  // Calibration & mapping logic
  useDerivedValue(() => {
    'worklet';

    if (useTouchControl) {
      rotationShared.value = touchPosition
        ? { x: touchPosition.value.x, y: touchPosition.value.y, z: 0 }
        : zeroV3d;

      return;
    }

    // console.log(orientationAngle.value);
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

      rotationShared.value = zeroV3d;
      return;
    }

    const init = initialGravity.value;
    const dg = subtractV3d(g, init);

    // Rotate into screen coordinates so offsets auto-swap with orientation
    const m = rotateV2d(dg, degToRad(-orientationAngle.value));
    const screen = negateV2dY(m);
    const smoothOffset = { ...scaleV2d(screen, alpha), z: dg.z * alpha };
    const smooth = scaleV3d(
      addV3d(scaleV3d(rotationShared.value, 1 - alpha), smoothOffset),
      scale
    );

    rotationShared.value = clampV3d(
      orientationAngle.value === 90
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

  // Resource setup
  useEffect(() => {
    if (!root || !device || !context) return;

    (async () => {
      const bitmap = await getBitmapFromURI(imageURI);
      const texture = await createTexture(root, bitmap);
      setImageTexture(texture);
      await loadTexture(root, bitmap, texture);

      if (!maskURI) return;
      const maskBitmap = await getBitmapFromURI(maskURI);
      const maskTex = await createTexture(root, maskBitmap);
      setMaskTexture(maskTex);
      await loadTexture(root, maskBitmap, maskTex);
    })();
  }, [root, device, context, imageURI, maskURI]);

  // Render loop
  useEffect(() => {
    if (!root || !device || !context || !imageTexture) return;

    //this sets the underlying resolution of the canvas to prevent blurriness
    const canvasElement = context.canvas;
    if (
      canvasElement &&
      canvasElement.width !== pixelWidth &&
      canvasElement.height !== pixelHeight
    ) {
      canvasElement.width = pixelWidth;
      canvasElement.height = pixelHeight;
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
      sampler: sampler,
    });

    const rotationBuffer = bufferManager.addBuffer(
      root,
      'rotationBuffer',
      d.vec3f(0.0)
    );

    const rotationBindGroup = createRotationValuesBindGroup(
      root,
      rotationBuffer
    );

    const glareOptionsBuffer = bufferManager.addBuffer(
      root,
      'glareBuffer',
      createGlareOptions(glareOptions ?? {})
    );
    const glareOptionsBindGroup = createGlareOptionsBindGroup(
      root,
      glareOptionsBuffer
    );

    const colorMaskBuffer = bufferManager.addBuffer(
      root,
      'colorMaskBuffer',
      colorMaskToTyped(
        createColorMask(colorMaskOptions ?? { baseColor: [-20, -20, -20] })
      )
    );
    const colorMaskBindGroup = createColorMaskBindGroup(root, colorMaskBuffer);

    const glareBGP = [
      imageTextureBindGroup,
      rotationBindGroup,
      glareOptionsBindGroup,
      colorMaskBindGroup,
    ];

    const colorMaskBGP = [
      imageTextureBindGroup,
      colorMaskBindGroup,
      rotationBindGroup,
    ];

    let glarePipeline = root['~unstable']
      .withVertex(mainVertex, {})
      .withFragment(newGlareFragment, getDefaultTarget(presentationFormat))
      .createPipeline();
    glarePipeline = attachBindGroups(glarePipeline, glareBGP);

    let colorMaskPipeline = root['~unstable']
      .withVertex(mainVertex, {})
      .withFragment(
        colorMaskFragment,
        getDefaultTarget(presentationFormat, blend)
      )
      .createPipeline();
    colorMaskPipeline = attachBindGroups(colorMaskPipeline, colorMaskBGP);

    //optional pipeline - mask
    const maskPipeline = createMaskPipeline(
      root,
      maskTexture,
      [imageTextureBindGroup, rotationBindGroup],
      sampler,
      presentationFormat
    );

    const reverseHoloPipeline = createReverseHoloPipeline(
      root,
      maskTexture,
      [imageTextureBindGroup, rotationBindGroup, glareOptionsBindGroup],
      sampler,
      presentationFormat
    );

    const holoPipeline = createHoloPipeline(
      root,
      imageTexture,
      [rotationBindGroup],
      sampler,
      presentationFormat
    );

    const pipelines: TgpuRenderPipeline[] = [glarePipeline];
    if (addTextureMask && maskPipeline) pipelines.push(maskPipeline);
    if (addReverseHolo && reverseHoloPipeline)
      pipelines.push(reverseHoloPipeline);
    if (addHolo && holoPipeline) pipelines.push(holoPipeline);
    if (colorMaskOptions) pipelines.push(colorMaskPipeline);

    const render = () => {
      rotationBuffer.write(d.vec3f(...componentsFromV3d(rotationShared.value)));

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

      pipelineRenderFunction(
        root,
        pipelines,
        [
          initialAttachment,
          loadingAttachment,
          loadingAttachment,
          loadingAttachment,
          loadingAttachment,
        ],
        view,
        false
      );

      context.present();
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
    rotationShared,
    bufferManager,
    glareOptions,
    colorMaskOptions,
    maskURI,
    addHolo,
    addReverseHolo,
    addTextureMask,
    pixelWidth,
    pixelHeight,
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
