import { ColorPresets } from './colorPresets';
import { type ColorMask, type vec3 } from '../types/types';

type ColorHighlightPresetMap = {
  readonly [K in keyof typeof ColorPresets]: ColorMask;
};

export const ColorHighlightPresets = Object.fromEntries(
  (Object.entries(ColorPresets) as [keyof typeof ColorPresets, vec3][]).map(
    ([key, color]) => {
      return [
        key,
        {
          baseColor: color,
          useHSV: true,
          hueToleranceRange: { upper: 15, lower: 15 },
        } as ColorMask,
      ];
    }
  )
) as ColorHighlightPresetMap;

export const createHighlightColor = (
  rgb: vec3,
  useHSV: boolean = true,
  hueToleranceRange: { upper: number; lower: number } = { upper: 15, lower: 15 }
) => {
  return {
    baseColor: rgb,
    useHSV,
    hueToleranceRange,
  } as ColorMask;
};
