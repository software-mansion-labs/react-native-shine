import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, View, type ViewStyle } from 'react-native';
import Animated, {
  SensorType,
  type SharedValue,
  useAnimatedSensor,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {
  Canvas,
  type CanvasRef,
  type RNCanvasContext,
} from 'react-native-wgpu';
import * as d from 'typegpu/data';
import type {
  SampledFlag,
  StorageFlag,
  TextureProps,
  TgpuRoot,
  TgpuTexture,
} from 'typegpu';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import {
  colorMaskArraySchema,
  precomputeColorMaskBindGroupLayout,
  precomputeColorMaskOutputBindGroupLayout,
  rotationSchema,
} from '../shaders/bindGroupLayouts';
import { subscribeToOrientationChange } from '../shaders/utils';
import type { ColorMask } from '../types/types';
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
import { baseTextureFragment } from '../shaders/fragmentShaders/baseTextureFragment';
import { PipelineManager } from '../shaders/resourceManagement/pipelineMap';
import { blend, type Effect } from '../enums/effectPresets';
import { createColorMasks } from '../types/typeUtils';
import { createColorMaskBindGroup } from '../shaders/bindGroupUtils';
import colorMaskFragment from '../shaders/fragmentShaders/colorMaskFragment';
import { precomputeColorMask } from '../shaders/computeShaders/precomputeColorMask';

export interface SharedProps {
  width: number;
  height: number;
  highlightColors?: ColorMask[];
  isHighlightInclusive?: boolean;
  lightPosition?: SharedValue<V2d>;
  translateViewIn3d?:
    | boolean
    | {
        perspective?: number;
        intensity?: number;
      };
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  effects?: Effect[];
}

interface ContentProps extends SharedProps {
  root: TgpuRoot;
  imageTexture: TgpuTexture<TextureProps>;
  maskTexture?: TgpuTexture<TextureProps>;
  colorMaskStorageTexture?: TgpuTexture<any> & StorageFlag;
  colorMaskStorageTextureSize?: {
    width: number;
    height: number;
  };
}

export default function Content({
  effects = [{ name: 'glare' }],
  highlightColors,
  isHighlightInclusive = true,
  height,
  imageTexture,
  maskTexture,
  root,
  lightPosition,
  width,
  translateViewIn3d = false,
  style,
  containerStyle,
  colorMaskStorageTexture,
  colorMaskStorageTextureSize,
}: ContentProps) {
  const { device } = root;
  // const { ref, context } = useGPUContext();
  const ref = useRef<CanvasRef>(null);
  const [context, setContext] = useState<RNCanvasContext | null>(null);

  useEffect(() => {
    if (ref) setContext(ref.current?.getContext('webgpu')!);
  }, [ref]);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const isCanvasReady = useSharedValue(true);

  const landscape = useSharedValue<boolean>(false);
  const rotation = useSharedValue<V3d>(zeroV3d); // final GPU offsets

  // Calibration shared values (UI thread)
  const initialGravity = useSharedValue<V3d>(zeroV3d);
  const calibSum = useSharedValue<V3d>(zeroV3d);
  const calibCount = useSharedValue<number>(0);
  const calibrated = useSharedValue<boolean>(false);
  const gravitySensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });

  const pipelineCache = useMemo(
    () =>
      new PipelineManager(root, presentationFormat, imageTexture, maskTexture),
    [imageTexture, maskTexture, presentationFormat, root]
  );

  const animatedStyle = useAnimatedStyle(() => {
    let perspective: number = 300;
    let intensity: number = 10;
    if (typeof translateViewIn3d === 'object') {
      perspective = translateViewIn3d.perspective ?? perspective;
      intensity = translateViewIn3d.intensity ?? intensity;
    }

    const rotX = rotation.value.x * intensity;
    const rotY = rotation.value.y * intensity;

    return {
      transform: [
        { perspective: perspective },
        { rotateX: `${-rotY}deg` },
        { rotateY: `${rotX}deg` },
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

    if (lightPosition) {
      rotation.value = lightPosition
        ? { x: lightPosition.value.x, y: lightPosition.value.y, z: 0 }
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

  //TODO: is this needed here?
  const effectsCache =
    JSON.stringify(effects) + JSON.stringify(highlightColors);

  useEffect(() => {
    const initPipelines = async () => {
      pipelineCache.pipelinesMap.clear();

      pipelineCache.addPipeline(baseTextureFragment);

      effects.forEach(({ name, options }) => {
        pipelineCache.addPipelineWithBuffer(name, options);
      });

      //TODO: move to effect definition
      if (highlightColors) {
        const colorMaskBuffer = pipelineCache.buffersMap.syncUniformBuffer(
          colorMaskArraySchema,
          createColorMasks(highlightColors, isHighlightInclusive)
        );
        const colorMaskBindGroup = createColorMaskBindGroup(
          root,
          colorMaskBuffer
        );

        if (colorMaskStorageTexture && colorMaskStorageTextureSize) {
          const precomputeColorMaskBindGroup = root.createBindGroup(
            precomputeColorMaskBindGroupLayout,
            {
              colorMaskStorage: colorMaskStorageTexture as TgpuTexture<{
                size: readonly number[];
                format: 'rgba8unorm';
              }> &
                StorageFlag,
            }
          );
          const precomputeColorMaskOutputBindGroup = root.createBindGroup(
            precomputeColorMaskOutputBindGroupLayout,
            {
              colorMaskOutput: colorMaskStorageTexture as TgpuTexture<{
                size: readonly number[];
                format: 'rgba8unorm';
              }> &
                SampledFlag,
            }
          );
          pipelineCache.addComputePipeline(precomputeColorMask, [
            colorMaskBindGroup,
            precomputeColorMaskBindGroup,
          ]);

          pipelineCache.runComputePipeline(
            precomputeColorMask,
            colorMaskStorageTextureSize
          );

          pipelineCache.addPipeline(
            colorMaskFragment,
            [colorMaskBindGroup, precomputeColorMaskOutputBindGroup],
            blend
          );
        }
      }
    };
    initPipelines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effectsCache,
    isHighlightInclusive,
    pipelineCache,
    root,
    colorMaskStorageTexture,
  ]);

  useEffect(() => {
    if (!context) {
      return;
    }
    // changing canvas size to prevent blur
    const pixelRatio = PixelRatio.get();
    const size = { x: width, y: height };
    const pixelSize = transformV2d(scaleV2d(size, pixelRatio), (v) =>
      Math.max(1, Math.round(v))
    );

    const canvasElement = context.canvas;

    if (
      canvasElement.width !== pixelSize.x &&
      canvasElement.height !== pixelSize.y
    ) {
      canvasElement.width = pixelSize.x;
      canvasElement.height = pixelSize.y;
    }
    //this is a workaround to prevent error logs but it should be handled by webgpu
    scheduleOnUI(() => {
      'worklet';
      context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
      });
      isCanvasReady.value = true;
    });
  }, [context, device, height, presentationFormat, width, isCanvasReady]);

  const frameCallback = useCallback(() => {
    if (!context || !isCanvasReady.value) {
      return;
    }

    pipelineCache.buffersMap
      .get(rotationSchema)
      ?.write(d.vec3f(...componentsFromV3d(rotation.value)));

    const view = context.getCurrentTexture().createView();
    pipelineCache.renderPipelines(view);
    context.present();
  }, [context, pipelineCache, rotation, isCanvasReady]);

  useFrameCallback(() => {
    scheduleOnRN(frameCallback);
  });

  return (
    <View
      style={{
        transform: translateViewIn3d
          ? [
              {
                matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 50, 1],
              },
            ]
          : [],
        ...containerStyle,
      }}
    >
      <Animated.View style={[translateViewIn3d && animatedStyle]}>
        <View>
          <Canvas
            ref={ref}
            style={[{ width, height }, style]}
            transparent={true}
          />
        </View>
      </Animated.View>
    </View>
  );
}
