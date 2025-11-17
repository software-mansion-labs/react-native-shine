import { useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, View, type ViewStyle } from 'react-native';
import Animated, {
  SensorType,
  type SharedValue,
  useAnimatedSensor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {
  Canvas,
  type CanvasRef,
  type RNCanvasContext,
} from 'react-native-wgpu';
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
import useAnimationFrame from '../hooks/useAnimationFrame';
import { TypedBufferMap } from '../shaders/resourceManagement/bufferManager';
import {
  createColorMaskBindGroup,
  createGlareBindGroup,
  createReverseHoloDetectionChannelFlagsBindGroup,
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
  Effect,
  GlareOptions,
  PipelineAttachmentPair,
} from '../types/types';
import {
  colorMasksToTyped,
  createColorMasks,
  createGlareOptions,
  createReverseHoloDetectionChannelFlags,
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
import { baseTextureFragment } from '../shaders/fragmentShaders/baseTextureFragment';

export interface SharedProps {
  width: number;
  height: number;
  glareOptions?: Partial<GlareOptions>;
  enableGlare?: boolean;
  highlightColors?: DeepPartiallyOptional<ColorMask, 'baseColor'>[];
  isHighlightInclusive?: boolean;
  lightPosition?: SharedValue<V2d>;
  // addReverseHolo?: boolean;
  // reverseHoloDetectionChannelOptions?: Partial<ReverseHoloDetectionChannelFlags>;
  // addHolo?: boolean;
  translateViewIn3d?:
    | boolean
    | {
        perspective?: number;
        intensity?: number;
      };
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  effects: Effect[];
}

interface ContentProps extends SharedProps {
  root: TgpuRoot;
  imageTexture: TgpuTexture<TextureProps>;
  maskTexture?: TgpuTexture<TextureProps>;
}

interface PipelineMap {
  baseTexture: TgpuRenderPipeline;
  glare: TgpuRenderPipeline | void;
  colorMask: TgpuRenderPipeline | void;
  mask: TgpuRenderPipeline | void;
  reverseHolo: TgpuRenderPipeline | void;
  holo: TgpuRenderPipeline | void;
}

export default function Content({
  // addHolo,
  // addReverseHolo,
  // reverseHoloDetectionChannelOptions,
  effects,
  highlightColors,
  isHighlightInclusive = true,
  glareOptions,
  enableGlare = true,
  height,
  imageTexture,
  maskTexture,
  root,
  lightPosition: touchPosition,
  width,
  translateViewIn3d = false,
  style,
  containerStyle,
}: ContentProps) {
  const { device } = root;
  // const { ref, context } = useGPUContext();
  const ref = useRef<CanvasRef>(null);
  const [context, setContext] = useState<RNCanvasContext | null>(null);
  // const context = ref.current!.getContext('webgpu')!;

  useEffect(() => {
    if (ref) setContext(ref.current?.getContext('webgpu')!);
  }, [ref]);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const renderRef = useRef<() => void>(null);

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

    if (touchPosition) {
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

    // const sampler = device.createSampler({
    //   magFilter: 'linear',
    //   minFilter: 'linear',
    //   mipmapFilter: 'linear',
    // });

    const sampler = root['~unstable'].createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    }) as any as GPUSampler; //TODO: delete this cast when TgpuFixedSampler gets exposed

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
      colorMasksToTyped(
        createColorMasks(
          highlightColors ?? [{ baseColor: [-20, -20, -20], useHSV: false }]
        ),
        isHighlightInclusive
      )
    );
    const colorMaskBindGroup = createColorMaskBindGroup(root, colorMaskBuffer);

    const reverseHoloEffect = effects
      ? effects.find((e) => e.name === 'reverseHolo')
      : undefined;
    const reverseHoloDetectionChannelFlagsBuffer = bufferMap.addBuffer(
      root,
      'reverseHoloDetectionChannelFlags',
      createReverseHoloDetectionChannelFlags(reverseHoloEffect?.options)
    );
    const reverseHoloDetectionChannelFlagsBindGroup =
      createReverseHoloDetectionChannelFlagsBindGroup(
        root,
        reverseHoloDetectionChannelFlagsBuffer,
        glareBuffer
      );

    const holoEffect = effects
      ? effects.find((e) => e.name === 'holo')
      : undefined;

    const pipelineMap: PipelineMap = {
      baseTexture: attachBindGroups(
        root['~unstable']
          .withVertex(mainVertex, {})
          .withFragment(
            baseTextureFragment,
            getDefaultTarget(presentationFormat)
          )
          .createPipeline(),
        [imageTextureBindGroup, rotationBindGroup]
      ),
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
        [
          imageTextureBindGroup,
          rotationBindGroup,
          reverseHoloDetectionChannelFlagsBindGroup,
        ],
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

      const { baseTexture, glare, mask, colorMask, holo, reverseHolo } =
        pipelineMap;

      const pairs: PipelineAttachmentPair[] = [
        [baseTexture, initialAttachment],
      ];

      if ((glareOptions || !enableGlare) && glare) {
        pairs.push([glare, loadingAttachment]);
      }
      if (mask) pairs.push([mask, loadingAttachment]);
      if (reverseHoloEffect && reverseHolo)
        pairs.push([reverseHolo, loadingAttachment]);
      if (holoEffect && holo) pairs.push([holo, loadingAttachment]);
      if (colorMask) pairs.push([colorMask, loadingAttachment]);

      pairs.forEach(([pipeline, attachment]) =>
        pipeline.withColorAttachment(attachment).draw(6)
      );
    };

    const presentContext = () => context.present();

    renderRef.current = () => {
      modifyBuffers();
      renderPipelines();
      presentContext();
    };

    // const res = tgpu.resolve({ externals: { reverseHoloFragment } });
    // console.log('reverseHoloFragment resolve:', res);
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
    enableGlare,
    highlightColors,
    pixelSize,
    effects,
    isHighlightInclusive,
  ]);

  useAnimationFrame(() => renderRef.current?.());

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
