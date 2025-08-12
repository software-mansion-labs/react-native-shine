import { f32 } from 'typegpu/data';
import type { bloomOptions, bloomOptionsPartial } from './types';

export const createBloomOptions = (
  options: bloomOptionsPartial
): bloomOptions => {
  const {
    glowPower,
    hueShiftAngleMax,
    hueShiftAngleMin,
    hueBlendPower,
    lightIntensity,
    bloomIntensity,
  } = options;

  const bloomOp = {
    glowPower: glowPower ?? 1.0,
    hueShiftAngleMax: hueShiftAngleMax ?? 1.0,
    hueShiftAngleMin: hueShiftAngleMin ?? 0.0,
    hueBlendPower: hueBlendPower ?? 1.0,
    lightIntensity: lightIntensity ?? 1.0,
    bloomIntensity: bloomIntensity ?? 1.0,
  };

  return bloomOp;
};

export const mapToF32 = <T extends Record<string, number>>(
  obj: T
): {
  [K in keyof T]: ReturnType<typeof f32>;
} => {
  const result = {} as any;
  for (const key in obj) {
    result[key] = f32(obj[key]);
  }

  return result;
};
