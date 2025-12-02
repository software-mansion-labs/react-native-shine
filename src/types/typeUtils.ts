import { vec2f, vec3f, vec4f } from 'typegpu/data';
import * as d from 'typegpu/data';
import type {
  ColorMask,
  vec3,
  HoloOptions,
  vec2,
  vec4,
  ColorMaskPreTypedSchema,
} from './types';
import { WAVE_CALLBACKS } from '../enums/waveCallback';
import {
  COLOR_MASK_MAX_COUNT,
  type ColorMaskSchema,
} from '../shaders/bindGroupLayouts';
import { div } from 'typegpu/std';
import { deepMerge } from '../shaders/utils';
import { COLOR_MASK_DEFAULT_OPTIONS } from '../enums/effectDefaults';

const COLOR_MASK_PLACEHOLDER = new Array(COLOR_MASK_MAX_COUNT).fill(
  COLOR_MASK_DEFAULT_OPTIONS
);

export const createColorMasks = (
  colorMasks: ColorMask[],
  reverseHighlight: boolean
) => {
  const dummyFilledArray = [
    ...colorMasks.map((mask) => {
      const merged = deepMerge(COLOR_MASK_DEFAULT_OPTIONS, mask);
      if ('hueMin' in mask || 'hueMax' in mask) {
        merged.useHSV = 1;
      }
      return merged;
    }),
    ...COLOR_MASK_PLACEHOLDER.slice(
      0,
      COLOR_MASK_MAX_COUNT - colorMasks.length
    ),
  ] as ColorMaskPreTypedSchema[];

  return {
    masks: dummyFilledArray.map(colorMaskToTyped),
    usedMaskCount: colorMasks.length,
    reverseHighlight: reverseHighlight ? 1 : 0,
  };
};

export const colorMaskToTyped = ({
  hueMin,
  hueMax,
  ...colorMask
}: ColorMaskPreTypedSchema): ColorMaskSchema => {
  const hueRange = (hueMax - hueMin + 360) % 360;
  return {
    ...colorMask,
    baseColor: div(numberArrToTyped(colorMask.baseColor), 255),
    rgbToleranceRange: {
      upper: div(numberArrToTyped(colorMask.rgbToleranceRange.upper), 255),
      lower: div(numberArrToTyped(colorMask.rgbToleranceRange.lower), 255),
    },
    hueStart: hueMin,
    hueRange: hueRange === 0 && hueMin !== hueMax ? 360 : hueRange,
    minLimits: d.vec2f(colorMask.saturationMin, colorMask.lightnessMin),
    maxLimits: d.vec2f(colorMask.saturationMax, colorMask.lightnessMax),
    debugMode: colorMask.debugMode ? 1 : 0,
  };
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
      throw new Error(
        'numberArrToTyped: Vector must be of length [2-4] but it was ' +
          vec.length
      );
  }

  const typed = convFn(...vec);
  return typed;
}
