export type vec3 = [number, number, number];
export type vec4 = [number, number, number, number];
export type quaternion = vec4;

export type bloomOptionsPartial = {
  glowPower?: number;
  hueShiftAngleMax?: number;
  hueShiftAngleMin?: number;
  hueBlendPower?: number;
  lightIntensity?: number;
  bloomIntensity?: number;
};

export type bloomOptions = {
  glowPower: number;
  hueShiftAngleMax: number;
  hueShiftAngleMin: number;
  hueBlendPower: number;
  lightIntensity: number;
  bloomIntensity: number;
};
