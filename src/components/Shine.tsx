import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useDevice, useGPUContext } from 'react-native-wgpu';
import { getOrInitRoot } from '../roots';
import mainVertex from '../shaders/vertexShaders/mainVertex';
import getBitmapFromURI from '../shaders/resourceManagement/bitmaps';
import {
  clamp,
  rotate2D,
  subscribeToOrientationChange,
  getAngleFromDimensions,
} from '../shaders/utils';
import type { TgpuRenderPipeline, TgpuTexture } from 'typegpu';
import {
  glareOptionsBindGroupLayout,
  colorMaskBindGroupLayout,
  rotationValuesBindGroupLayout,
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
  createBindGroupPairs,
  createGlareOptions,
  createColorMask,
  colorMaskToTyped,
} from '../types/typeUtils';
import type {
  BindGroupPair,
  GlareOptions,
  ColorMask,
  DeepPartiallyOptional,
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

export interface ShineProps {
  width: number;
  height: number;
  imageURI: string;
  glareOptions?: Partial<GlareOptions>;
  colorMaskOptions?: DeepPartiallyOptional<ColorMask, 'baseColor'>;
  maskURI?: string;
  useTouchControl?: boolean;
  touchPosition?: SharedValue<[number, number]>;
  addTextureMask?: boolean;
  addReverseHolo?: boolean;
  addHolo?: boolean;
}

export function Shine({
  width,
  height,
  imageURI,
  glareOptions: glareOptions,
  colorMaskOptions,
  maskURI,
  touchPosition,
  useTouchControl = false,
  addTextureMask = false,
  addHolo = false,
  addReverseHolo = false,
}: ShineProps) {
  const { device = null } = useDevice();
  const root = device ? getOrInitRoot(device) : null;
  const { ref, context } = useGPUContext();
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const frameRef = useRef<number | null>(null);

  //changing canvas size to prevent blur
  const dpr = PixelRatio.get();
  const logicalWidth = width;
  const logicalHeight = height;
  const pixelWidth = Math.max(1, Math.round(logicalWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(logicalHeight * dpr));

  const [imageTexture, setImageTexture] = useState<TgpuTexture | null>(null);
  const [maskTexture, setMaskTexture] = useState<TgpuTexture | null>(null);

  const orientationAngle = useSharedValue<number>(0); // degrees
  const rotationShared = useSharedValue<[number, number, number]>([0, 0, 0]); // final GPU offsets

  // Calibration shared values (UI thread)
  const initialGravity = useSharedValue<[number, number, number]>([0, 0, 0]);
  const calibSum = useSharedValue<[number, number, number]>([0, 0, 0]);
  const calibCount = useSharedValue<number>(0);
  const calibrated = useSharedValue<boolean>(false);
  const gravitySensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });

  const bufferManager = useMemo(
    () => new TypedBufferMap(bufferData as BufferDataMap),
    []
  );

  //TODO: add once again, when the wgpu issues are fixed :3

  const animatedStyle = useAnimatedStyle(() => {
    // const rotX = rotationShared.value[0] * 10;
    // const rotY = rotationShared.value[1] * 10;

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
    const unsubscribe = subscribeToOrientationChange((angleDeg) => {
      orientationAngle.value = angleDeg;
    });

    return () => unsubscribe();
  }, [orientationAngle]);

  // Calibration & mapping logic
  useDerivedValue(() => {
    'worklet';

    if (useTouchControl) {
      rotationShared.value = touchPosition
        ? [...touchPosition.value, 0]
        : [0, 0, 0];

      return;
    }

    // console.log(orientationAngle.value);
    const v: { x: number; y: number; z: number } = gravitySensor.sensor
      ?.value ??
      gravitySensor.sensor.value ?? { x: 0, y: 0, z: 0 };

    const gx = v.x ?? 0;
    const gy = v.y ?? 0;
    const gz = v.z ?? 0;

    const CALIBRATION_SAMPLES = 40;
    const alpha = 0.15; // smoothing
    const scale = 0.6;

    if (!calibrated.value) {
      // accumulate baseline in device coordinates
      const s = calibSum.value;
      const c = calibCount.value + 1;
      calibSum.value = [s[0] + gx, s[1] + gy, s[2] + gz];
      calibCount.value = c;

      if (c >= CALIBRATION_SAMPLES) {
        const avg = calibSum.value;
        initialGravity.value = [avg[0] / c, avg[1] / c, avg[2] / c];
        calibrated.value = true;
      }

      rotationShared.value = [0, 0, 0];
      return;
    }

    const init = initialGravity.value;
    const dx = gx - init[0];
    const dy = gy - init[1];
    const dz = gz - init[2];

    // Rotate into screen coordinates so offsets auto-swap with orientation
    const [mx, my] = rotate2D([dx, dy], -orientationAngle.value);
    const screenX = mx;
    const screenY = -my;

    const prev = rotationShared.value;
    const smoothX = prev[0] * (1 - alpha) + screenX * alpha;
    const smoothY = prev[1] * (1 - alpha) + screenY * alpha;
    const smoothZ = prev[2] * (1 - alpha) + dz * alpha;

    if (orientationAngle.value === 90) {
      rotationShared.value = [
        clamp(smoothY * scale, -1, 1),
        clamp(-smoothX * scale, -1, 1),
        clamp(smoothZ * scale, -1, 1),
      ];
    } else {
      rotationShared.value = [
        clamp(smoothX * scale, -1, 1),
        clamp(smoothY * scale, -1, 1),
        clamp(smoothZ * scale, -1, 1),
      ];
    }
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

    const glareBGP: BindGroupPair[] = createBindGroupPairs(
      [
        textureBindGroupLayout,
        rotationValuesBindGroupLayout,
        glareOptionsBindGroupLayout,
        colorMaskBindGroupLayout,
      ],
      [
        imageTextureBindGroup,
        rotationBindGroup,
        glareOptionsBindGroup,
        colorMaskBindGroup,
      ]
    );

    const colorMaskBGP: BindGroupPair[] = createBindGroupPairs(
      [
        textureBindGroupLayout,
        colorMaskBindGroupLayout,
        rotationValuesBindGroupLayout,
      ],
      [imageTextureBindGroup, colorMaskBindGroup, rotationBindGroup]
    );

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
      createBindGroupPairs(
        [textureBindGroupLayout, rotationValuesBindGroupLayout],
        [imageTextureBindGroup, rotationBindGroup]
      ),
      sampler,
      presentationFormat
    );

    const reverseHoloBGP: BindGroupPair[] = createBindGroupPairs(
      [
        textureBindGroupLayout,
        rotationValuesBindGroupLayout,
        glareOptionsBindGroupLayout,
      ],
      [imageTextureBindGroup, rotationBindGroup, glareOptionsBindGroup]
    );

    const reverseHoloPipeline = createReverseHoloPipeline(
      root,
      maskTexture,
      reverseHoloBGP,
      sampler,
      presentationFormat
    );

    const holoBGP: BindGroupPair[] = createBindGroupPairs(
      [rotationValuesBindGroupLayout],
      [rotationBindGroup]
    );

    const holoPipeline = createHoloPipeline(
      root,
      imageTexture,
      holoBGP,
      sampler,
      presentationFormat
    );

    const pipelines: TgpuRenderPipeline[] = [glarePipeline];
    if (addTextureMask && maskPipeline) pipelines.push(maskPipeline);
    if (addReverseHolo && reverseHoloPipeline)
      pipelines.push(reverseHoloPipeline);
    if (addHolo && holoPipeline) pipelines.push(holoPipeline);
    if (colorMaskOptions) pipelines.push(colorMaskPipeline);

    const rot = d.vec3f(0.0);
    let view: GPUTextureView;
    let initialAttachment;
    let loadingAttachment;
    const isInSinglePass = false;
    const render = () => {
      rot[0] = rotationShared.value[0];
      rot[1] = rotationShared.value[1];
      rot[2] = rotationShared.value[2];
      rotationBuffer.write(rot);

      view = context.getCurrentTexture().createView();
      initialAttachment = {
        view: view,
        clearValue: [0, 0, 0, 0],
        loadOp: 'clear' as GPULoadOp,
        storeOp: 'store' as GPUStoreOp,
      };
      loadingAttachment = {
        view: view,
        clearValue: [0, 0, 0, 0],
        loadOp: 'load' as GPULoadOp,
        storeOp: 'store' as GPUStoreOp,
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
        isInSinglePass
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
            // { width: logicalWidth, height: logicalHeight },
          ]
        }
      >
        <Canvas
          ref={ref}
          style={[
            { width: logicalWidth, height: logicalHeight },
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
