import type { ColorMaskPreTypedSchema } from '../types/types';

export const GLARE_DEFAULTS = {
  glowPower: 0.5,
  glareIntensity: 0.4,
  lightIntensity: 1.1,
  glareColor: {
    hueBlendPower: 1.0,
    hueShiftAngleMin: -30,
    hueShiftAngleMax: 30,
  },
} as const;

export const REVERSE_HOLO_DEFAULTS = {
  redChannel: 1.0,
  greenChannel: 0.0,
  blueChannel: 0.0,
  hue: 0.0,
  saturation: 0.0,
  value: 0.0,
} as const;

export const HOLO_DEFAULTS = {
  directionDegree: 45,
  shift: 0.1,
  rotationShiftPower: 0.6,
  holoSize: 0.12,
  holoMultiplier: 2.5,
  holoEaseSize: 0.2,
  holoVisibility: 0.88,
  holoSaturation: 0.5,
} as const;

export const COLOR_MASK_DEFAULT_OPTIONS: ColorMaskPreTypedSchema = {
  rgbToleranceRange: {
    upper: [20, 20, 20],
    lower: [20, 20, 20],
  },
  baseColor: [0, 0, 0],
  hueMin: 0,
  hueMax: 360,
  saturationMin: 0.2,
  saturationMax: 1,
  lightnessMin: 0.3,
  lightnessMax: 0.9,
  debugMode: false,
  useHSV: 0,
} as const;
