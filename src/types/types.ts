import type { TgpuBindGroup, TgpuBindGroupLayout } from 'typegpu';

export type vec2 = [number, number];
export type vec3 = [number, number, number];
export type vec4 = [number, number, number, number];
export type quaternion = vec4;

export type BloomOptions = {
  glowPower: number;
  hueShiftAngleMax: number;
  hueShiftAngleMin: number;
  hueBlendPower: number;
  lightIntensity: number;
  bloomIntensity: number;
};

export type ColorMask = {
  baseColor: vec3;
  rgbToleranceRange: {
    upper: vec3;
    lower: vec3;
  };
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

export type DeepPartiallyOptional<T, K extends keyof T> = Required<Pick<T, K>> &
  DeepPartial<Omit<T, K>>;

export type BindGroupPair = {
  layout: TgpuBindGroupLayout;
  group: TgpuBindGroup;
};
