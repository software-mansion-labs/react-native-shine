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

export type PartiallyOptional<T, K extends keyof T> = {
  [P in K]: T[P];
} & Partial<Omit<T, K>>;
