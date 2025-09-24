import { f32, vec2f, vec3f, vec4f } from 'typegpu/data';
import type {
  GlareOptions,
  ColorMask,
  DeepPartiallyOptional,
  vec3,
  HoloOptions,
} from './types';
import { div } from 'typegpu/std';
import { WAVE_CALLBACKS } from '../enums/waveCallback';

export const createGlareOptions = (
  options: Partial<GlareOptions>
): GlareOptions => {
  const {
    glowPower,
    hueShiftAngleMax,
    hueShiftAngleMin,
    hueBlendPower,
    lightIntensity,
    glareIntensity,
  } = options;

  const glareOp = {
    glowPower: glowPower ?? 1.0,
    hueShiftAngleMax: hueShiftAngleMax ?? 1.0,
    hueShiftAngleMin: hueShiftAngleMin ?? 0.0,
    hueBlendPower: hueBlendPower ?? 1.0,
    lightIntensity: lightIntensity ?? 1.0,
    glareIntensity: glareIntensity ?? 1.0,
  };

  return glareOp;
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
  colorMask: DeepPartiallyOptional<ColorMask, 'baseColor'>
): ColorMask => {
  const { baseColor, rgbToleranceRange } = colorMask;
  const baseTolerance = {
    upper: [20, 20, 20] as vec3,
    lower: [20, 20, 20] as vec3,
  };
  const tolerance = { ...baseTolerance, ...rgbToleranceRange };

  const mask: ColorMask = {
    baseColor: baseColor,
    rgbToleranceRange: tolerance,
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

export const createHoloOptions = (
  options: Partial<HoloOptions>
): HoloOptions => {
  const { intensity, waveCallback } = options;
  const holoOpt = {
    intensity: intensity ?? 0.7,
    waveCallback: waveCallback ?? WAVE_CALLBACKS.default,
  };

  return holoOpt;
};

export const numberArrToTyped = (vec: number[]) => {
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
