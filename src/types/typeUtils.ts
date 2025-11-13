import { f32, vec2f, vec3f, vec4f } from 'typegpu/data';
import * as d from 'typegpu/data';
import type {
  GlareOptions,
  ColorMask,
  DeepPartiallyOptional,
  vec3,
  HoloOptions,
  ReverseHoloDetectionChannelFlags,
} from './types';
import { div } from 'typegpu/std';
import { WAVE_CALLBACKS } from '../enums/waveCallback';
import { colorMaskDebug } from '../config/debugMode';
import { COLOR_MASK_MAX_COUNT } from '../shaders/bindGroupLayouts';

export const createGlareOptions = (
  options: Partial<GlareOptions>
): GlareOptions => {
  const { glowPower, glareColor, lightIntensity, glareIntensity } = options;
  const { hueBlendPower, hueShiftAngleMax, hueShiftAngleMin } =
    glareColor || {};

  const glareOp = {
    glowPower: glowPower ?? 1.0,
    lightIntensity: lightIntensity ?? 1.0,
    glareIntensity: glareIntensity ?? 1.0,
    glareColor: {
      hueShiftAngleMax: hueShiftAngleMax ?? 1.0,
      hueShiftAngleMin: hueShiftAngleMin ?? 0.0,
      hueBlendPower: hueBlendPower ?? 1.0,
    },
  };

  return glareOp;
};

export const glareOptionsToTyped = (glareOptions: GlareOptions) => {
  return {
    glowPower: f32(glareOptions.glowPower),
    lightIntensity: f32(glareOptions.lightIntensity),
    glareIntensity: f32(glareOptions.glareIntensity),
    glareColor: {
      hueShiftAngleMax: f32(glareOptions.glareColor.hueShiftAngleMax),
      hueShiftAngleMin: f32(glareOptions.glareColor.hueShiftAngleMin),
      hueBlendPower: f32(glareOptions.glareColor.hueBlendPower),
    },
  };
};

export const createColorMasks = (
  colorMasks: DeepPartiallyOptional<ColorMask, 'baseColor'>[]
): ColorMask[] => {
  const newColorMasks: ColorMask[] = new Array(16);
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

  for (let i = 0; i < newColorMasks.length; i++) {
    if (newColorMasks[i]) continue;
    newColorMasks[i] = {
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

  // TODO: add radian and degree angle handling
  // '123deg' <- interpret as a numeric angle value
  //     2     <- interpret as a radian value

  return newColorMasks;
};

export const colorMasksToTyped = (colorMasks: ColorMask[]) => {
  const typedColorMasks = new Array(COLOR_MASK_MAX_COUNT);
  for (let i = 0; i < colorMasks.length; i++) {
    typedColorMasks[i] = colorMaskToTyped(colorMasks[i]!);
  }

  return typedColorMasks;
};

export const colorMaskToTyped = (colorMask: ColorMask) => {
  const result = {
    baseColor: div(numberArrToTyped(colorMask.baseColor), 255),
    rgbToleranceRange: {
      upper: div(numberArrToTyped(colorMask.rgbToleranceRange.upper), 255),
      lower: div(numberArrToTyped(colorMask.rgbToleranceRange.lower), 255),
    },
    useHSV: d.u32(colorMask.useHSV ? 1 : 0),
    hueToleranceRange: {
      lower: div(f32(colorMask.hueToleranceRange.lower), 360),
      upper: div(f32(colorMask.hueToleranceRange.upper), 360),
    },
    brightnessTolerance: f32(colorMask.brightnessTolerance),
    saturationTolerance: f32(colorMask.saturationTolerance),
    lowSaturationThreshold: f32(colorMask.lowSaturationThreshold),
    lowBrightnessThreshold: f32(colorMask.lowBrightnessThreshold),
    debugMode: d.u32(colorMask.debugMode ? d.u32(1) : d.u32(0)),
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

export const createReverseHoloDetectionChannelFlags = (
  options?: Partial<ReverseHoloDetectionChannelFlags>
) => {
  let channelFlags;
  if (options) {
    const { redChannel, greenChannel, blueChannel, hue, saturation, value } =
      options;

    channelFlags = {
      redChannel: redChannel ?? d.f32(0.0),
      greenChannel: greenChannel ?? d.f32(0.0),
      blueChannel: blueChannel ?? d.f32(0.0),
      hue: hue ?? d.f32(0.0),
      saturation: saturation ?? d.f32(0.0),
      value: value ?? d.f32(0.0),
    };
  } else {
    channelFlags = {
      redChannel: d.f32(1.0),
      greenChannel: d.f32(0.0),
      blueChannel: d.f32(0.0),
      hue: d.f32(0.0),
      saturation: d.f32(0.0),
      value: d.f32(0.0),
    };
  }

  return channelFlags;
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
