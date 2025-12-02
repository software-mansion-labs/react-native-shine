import type {
  TgpuBindGroup,
  TgpuBindGroupLayout,
  TgpuFragmentFn,
  TgpuRenderPipeline,
  TgpuRoot,
  TgpuUniform,
  ValidateBufferSchema,
} from 'typegpu';
import type { WaveCallbackFn } from '../enums/waveCallback';
import type { AnyWgslData, Infer, Vec2f, Vec4f } from 'typegpu/data';
import type {
  ColorMaskSchema,
  maskTextureBindGroupLayout,
} from '../shaders/bindGroupLayouts';

export type vec2 = [number, number];
export type vec3 = [number, number, number];
export type vec4 = [number, number, number, number];
export type quaternion = vec4;
type BaseColorMask = { debugMode: boolean };
export type RGBColorMask = BaseColorMask & {
  baseColor: vec3;
  rgbToleranceRange: {
    upper: vec3;
    lower: vec3;
  };
};
export type HSLColorMask = BaseColorMask & {
  hueMin: number;
  hueMax: number;
  saturationMin: number;
  saturationMax: number;
  lightnessMin: number;
  lightnessMax: number;
};

export type ColorMask =
  | DeepPartiallyOptional<RGBColorMask, 'baseColor'>
  | DeepPartial<HSLColorMask>;

export type ColorMaskPreTypedSchema = HSLColorMask &
  RGBColorMask &
  Pick<ColorMaskSchema, 'useHSV'>;

export type HoloOptions = {
  intensity: number;
  waveCallback: WaveCallbackFn;
};

//makes all keys besides specified optional
export type PartiallyOptional<T, K extends keyof T> = {
  [P in K]: T[P];
} & Partial<Omit<T, K>>;

export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined;

//makes every object and its' properties optional
//unless the objects are contained in any kind of array
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Primitive | any[] ? T[P] : DeepPartial<T[P]>;
};

export type DeepPartiallyOptional<T, K extends keyof T> = T extends any
  ? Required<Pick<T, K>> & DeepPartial<Omit<T, K>>
  : never;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type BindGroupPair = {
  layout: TgpuBindGroupLayout;
  group: TgpuBindGroup;
};

export type ColorAttachment = Parameters<
  TgpuRenderPipeline['withColorAttachment']
>[0];

export type PipelineAttachmentPair = [TgpuRenderPipeline, ColorAttachment];

export type FragmentShaderReturnType = Vec4f;
export type FragmentType = TgpuFragmentFn<
  {
    uv: Vec2f;
  },
  FragmentShaderReturnType
>;

export type AnySchema = ValidateBufferSchema<AnyWgslData>;

export type BufferConfig<S extends AnySchema> = {
  schema: S;
  defaultOptions: Infer<S>;
};

export type TgpuUniformBuffer<S extends AnySchema> = TgpuUniform<S>['buffer'];

export type TgpuUniformBufferTuple<
  T extends readonly BufferConfig<AnySchema>[],
> = {
  [K in keyof T]: T[K] extends BufferConfig<infer S>
    ? TgpuUniformBuffer<S>
    : never;
};
export type BindGroupCreatorArgument = {
  root: TgpuRoot;
  maskBindGroup: TgpuBindGroup<UnwrapLayout<typeof maskTextureBindGroupLayout>>;
};

export type EffectDefinition<
  TConfig extends readonly BufferConfig<AnySchema>[],
> = {
  buffers: TConfig;
  fragment: FragmentType;
  bindGroupCreator: (
    argument: BindGroupCreatorArgument,
    buffers: TgpuUniformBufferTuple<TConfig>
  ) => TgpuBindGroup[];
  blend?: GPUBlendState;
};

export function createEffect<
  const TConfig extends readonly BufferConfig<AnySchema>[],
>(definition: EffectDefinition<TConfig>) {
  return definition;
}

export type UnwrapLayout<T> =
  T extends TgpuBindGroupLayout<infer U> ? U : never;

type GetInferredFromConfig<T> = T extends { schema: infer S }
  ? S extends AnySchema
    ? Infer<S>
    : never
  : never;

export type ExtractEffectOptions<TDef> =
  TDef extends EffectDefinition<infer TConfig>
    ? UnionToIntersection<GetInferredFromConfig<TConfig[number]>>
    : never;
