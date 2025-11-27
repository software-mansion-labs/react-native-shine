import { vec2f, vec3f, vec4f } from 'typegpu/data';
import * as d from 'typegpu/data';
import type {
  ColorMask,
  DeepPartiallyOptional,
  vec3,
  HoloOptions,
  vec2,
  vec4,
} from './types';
import { div } from 'typegpu/std';
import { WAVE_CALLBACKS } from '../enums/waveCallback';
import { colorMaskDebug } from '../config/debugMode';
import {
  COLOR_MASK_MAX_COUNT,
  type ColorMaskSchema,
} from '../shaders/bindGroupLayouts';

export const createColorMasks = (
  colorMasks: DeepPartiallyOptional<ColorMask, 'baseColor'>[]
): ColorMask[] => {
  const newColorMasks: ColorMask[] = [];
  for (const i in colorMasks) {
    const {
      baseColor,
      rgbToleranceRange,
      useHSV,
      hueToleranceRange,
      brightnessTolerance,
      saturationTolerance,
      lowBrightnessThreshold,
      lowSaturationThreshold,
    } = colorMasks[i]!;
    const baseTolerance = {
      upper: [20, 20, 20] as vec3,
      lower: [20, 20, 20] as vec3,
    };
    const baseHueTolerance = {
      upper: 20,
      lower: 20,
    };
    const tolerance = { ...baseTolerance, ...rgbToleranceRange };
    const hueTolerance = { ...baseHueTolerance, ...hueToleranceRange };
    const newColorMask: ColorMask = {
      baseColor: baseColor,
      rgbToleranceRange: tolerance,
      useHSV: useHSV!!,
      hueToleranceRange: hueTolerance,
      brightnessTolerance: brightnessTolerance ?? 1.0,
      saturationTolerance: saturationTolerance ?? 1.0,
      lowBrightnessThreshold: lowBrightnessThreshold ?? 0.0,
      lowSaturationThreshold: lowSaturationThreshold ?? 0.0,
      debugMode: colorMaskDebug,
    };

    newColorMasks[i] = newColorMask;
  }

  // TODO: add radian and degree angle handling
  // '123deg' <- interpret as a numeric angle value
  //     2     <- interpret as a radian value

  return newColorMasks;
};

const fillColorMaskBufferWithDummies = (
  colorMasks: ColorMask[]
): ColorMask[] => {
  const dummyFilledColorMasks = new Array(COLOR_MASK_MAX_COUNT);
  for (let i = 0; i < dummyFilledColorMasks.length; i++) {
    if (i < colorMasks.length) {
      dummyFilledColorMasks[i] = colorMasks[i];
    } else {
      dummyFilledColorMasks[i] = {
        baseColor: [0, 0, 0],
        useHSV: false,
        rgbToleranceRange: {
          upper: [0, 0, 0],
          lower: [0, 0, 0],
        },
        hueToleranceRange: {
          upper: 0,
          lower: 0,
        },
      };
    }
  }
  return dummyFilledColorMasks;
};

export const colorMasksToTyped = (
  colorMasks: ColorMask[],
  reverseHighlight: boolean
) => {
  const typedColorMasks = fillColorMaskBufferWithDummies(colorMasks).map(
    (mask) => colorMaskToTyped(mask)
  );
  return {
    masks: typedColorMasks,
    usedMaskCount: colorMasks.length,
    reverseHighlight: reverseHighlight ? 1 : 0,
  };
};

export const colorMaskToTyped = (colorMask: ColorMask) => {
  const result = {
    baseColor: div(numberArrToTyped(colorMask.baseColor), 255),
    rgbToleranceRange: {
      upper: div(numberArrToTyped(colorMask.rgbToleranceRange.upper), 255),
      lower: div(numberArrToTyped(colorMask.rgbToleranceRange.lower), 255),
    },
    useHSV: colorMask.useHSV ? 1 : 0,
    hueToleranceRange: {
      lower: div(colorMask.hueToleranceRange.lower, 360),
      upper: div(colorMask.hueToleranceRange.upper, 360),
    },
    brightnessTolerance: colorMask.brightnessTolerance,
    saturationTolerance: colorMask.saturationTolerance,
    lowSaturationThreshold: colorMask.lowSaturationThreshold,
    lowBrightnessThreshold: colorMask.lowBrightnessThreshold,
    debugMode: colorMask.debugMode ? 1 : 0,
  } as d.Infer<ColorMaskSchema>;

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

export function numberArrToTyped(vec: vec2): d.v2f;
export function numberArrToTyped(vec: vec3): d.v3f;
export function numberArrToTyped(vec: vec4): d.v4f;
export function numberArrToTyped(vec: number[]): d.v2f | d.v3f | d.v4f;
export function numberArrToTyped(vec: number[]) {
  let convFn: ((...args: number[]) => d.v2f | d.v3f | d.v4f) | null = null;
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
}
