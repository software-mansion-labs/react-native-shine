import { f32, vec2f, vec3f, vec4f } from 'typegpu/data';
import type { BloomOptions, ColorMask, PartiallyOptional, vec3 } from './types';
import { div } from 'typegpu/std';

export const createBloomOptions = (
  options: Partial<BloomOptions>
): BloomOptions => {
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

export const createColorMask = (
  colorMask: PartiallyOptional<ColorMask, 'baseColor'>
) => {
  const { baseColor, rgbToleranceRange } = colorMask;
  const baseTolerance = {
    upper: [20, 20, 20] as vec3,
    lower: [20, 20, 20] as vec3,
  };

  const mask: ColorMask = {
    baseColor: baseColor,
    rgbToleranceRange: rgbToleranceRange || baseTolerance,
  };

  return mask;
};

export const colorMaskToTyped = (colorMask: ColorMask) => {
  const result = {
    baseColor: div(numberArrToTyped(colorMask.baseColor), 255),
    rgbToleranceRange: {
      upper: div(numberArrToTyped(colorMask.rgbToleranceRange.upper), 255),
      lower: div(numberArrToTyped(colorMask.rgbToleranceRange.lower), 255),
    },
  };
  return result;
};

const numberArrToTyped = (vec: number[]) => {
  let convFn: ((...args: number[]) => any) | null = null;
  switch (vec.length) {
    case 2:
      convFn = vec2f;
      break;
    case 3:
      convFn = vec3f;
      break;
    case 4:
      convFn = vec4f;
      break;
    default:
      throw new Error('numberArrToTyped: Vector must be of length [2-4]');
  }

  const typed = convFn(...vec);
  return typed;
};
