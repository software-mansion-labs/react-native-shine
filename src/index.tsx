import { useEffect, useRef, useState } from 'react';
import { Canvas, useDevice, useGPUContext } from 'react-native-wgpu';
import { getOrInitRoot } from './roots';
import mainVertex from './shaders/vertexShaders/mainVertex';
import getBitmapFromURI from './shaders/resourceManagement';
import {
  createTexture,
  loadTexture,
  clamp,
  rotate2D,
  subscribeToOrientationChange,
  getAngleFromDimensions,
} from './shaders/utils';
import type { TgpuTexture } from 'typegpu';
import {
  bloomOptionsBindGroupLayout,
  colorMaskBindGroupLayout,
  rotationValuesBindGroupLayout,
  textureBindGroupLayout,
} from './shaders/bindGroupLayouts';
import {
  SensorType,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import * as d from 'typegpu/data';
import { Platform } from 'react-native';
import bloomFragment from './shaders/fragmentShaders/bloomFragment';
import {
  createBloomOptionsBindGroup,
  createBloomOptionsBuffer,
  createColorMaskBindGroup,
  createColorMaskBuffer,
  createRotationBuffer,
  createRotationValuesBindGroup,
} from './shaders/bindGroupUtils';
import {
  createBindGroupPairs,
  createBloomOptions,
  createColorMask,
} from './types/typeUtils';
import type {
  BindGroupPair,
  BloomOptions,
  ColorMask,
  DeepPartiallyOptional,
} from './types/types';
import { attachBindGroups, getDefaultTarget } from './shaders/pipelineSetups';
import colorMaskFragment from './shaders/fragmentShaders/colorMaskFragment';
interface ShineProps {
  width: number;
  height: number;
  imageURI: string;
  bloomOptions?: Partial<BloomOptions>;
  colorMaskOptions?: DeepPartiallyOptional<ColorMask, 'baseColor'>;
}

export function Shine({
  width,
  height,
  imageURI,
  bloomOptions,
  colorMaskOptions,
}: ShineProps) {
  const { device = null } = useDevice();
  const root = device ? getOrInitRoot(device) : null;
  const { ref, context } = useGPUContext();
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const frameRef = useRef<number | null>(null);

  const [imageTexture, setImageTexture] = useState<TgpuTexture | null>(null);

  const orientationAngle = useSharedValue<number>(0); // degrees
  const rotationShared = useSharedValue<[number, number, number]>([0, 0, 0]); // final GPU offsets

  // Calibration shared values (UI thread)
  const initialGravity = useSharedValue<[number, number, number]>([0, 0, 0]);
  const calibSum = useSharedValue<[number, number, number]>([0, 0, 0]);
  const calibCount = useSharedValue<number>(0);
  const calibrated = useSharedValue<boolean>(false);

  const gravitySensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });

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

    // console.log(orientationAngle.value);
    const v: any = gravitySensor.sensor?.value ??
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
    })();
  }, [root, device, context, imageURI]);

  // Render loop
  useEffect(() => {
    if (!root || !device || !context || !imageTexture) return;

    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
    const textureBindGroup = root.createBindGroup(textureBindGroupLayout, {
      texture: root.unwrap(imageTexture).createView(),
      sampler,
    });

    const rotationBuffer = createRotationBuffer(root);
    const rotationBindGroup = createRotationValuesBindGroup(
      root,
      rotationBuffer
    );

    const bloomOptionsBuffer = createBloomOptionsBuffer(
      root,
      createBloomOptions(bloomOptions ?? {})
    );
    const bloomOptionsBindGroup = createBloomOptionsBindGroup(
      root,
      bloomOptionsBuffer
    );

    const colorMaskBuffer = createColorMaskBuffer(
      root,
      createColorMask(colorMaskOptions ?? { baseColor: [-20, -20, -20] })
    );
    const colorMaskBindGroup = createColorMaskBindGroup(root, colorMaskBuffer);

    const bloomBGP: BindGroupPair[] = createBindGroupPairs(
      [
        textureBindGroupLayout,
        rotationValuesBindGroupLayout,
        bloomOptionsBindGroupLayout,
        colorMaskBindGroupLayout,
      ],
      [
        textureBindGroup,
        rotationBindGroup,
        bloomOptionsBindGroup,
        colorMaskBindGroup,
      ]
    );

    const maskBGP: BindGroupPair[] = createBindGroupPairs(
      [textureBindGroupLayout, colorMaskBindGroupLayout],
      [textureBindGroup, colorMaskBindGroup]
    );

    let bloomPipeline = root['~unstable']
      .withVertex(mainVertex, {})
      .withFragment(bloomFragment, getDefaultTarget(presentationFormat))
      .createPipeline();
    bloomPipeline = attachBindGroups(bloomPipeline, bloomBGP);

    let maskPipeline = root['~unstable']
      .withVertex(mainVertex, {})
      .withFragment(colorMaskFragment, getDefaultTarget(presentationFormat))
      .createPipeline();
    maskPipeline = attachBindGroups(maskPipeline, maskBGP);

    const render = () => {
      const rot = rotationShared.value;
      rotationBuffer.write(d.vec3f(rot[0]!, rot[1]!, rot[2]!));

      bloomPipeline
        .withColorAttachment({
          view: context.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 0],
          loadOp: 'clear',
          storeOp: 'store',
        })
        .draw(6);

      maskPipeline
        .withColorAttachment({
          view: context.getCurrentTexture().createView(),
          loadOp: 'load',
          storeOp: 'store',
        })
        .draw(6);

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
    rotationShared,
    bloomOptions,
    colorMaskOptions,
  ]);

  return (
    <Canvas
      ref={ref}
      style={{ width, height, aspectRatio: width / height }}
      transparent={Platform.OS === 'ios'}
    />
  );
}

export { subscribeToOrientationChange, getAngleFromDimensions };
