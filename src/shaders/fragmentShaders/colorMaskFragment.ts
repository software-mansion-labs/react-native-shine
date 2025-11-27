import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import { colorMaskBindGroupLayout } from '../bindGroupLayouts';
import { getPixelColorFromNonReversedVector, rgbToHSV } from '../tgpuUtils';
import type { ColorMaskArrayShaderAssert } from '../../types/types';

const colorMaskFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  let color = getPixelColorFromNonReversedVector(input.uv);

  const masks = colorMaskBindGroupLayout.$.colorMasks
    .masks as ColorMaskArrayShaderAssert;
  const usedMaskCount = colorMaskBindGroupLayout.$.colorMasks.usedMaskCount;
  const reverseHighlight =
    colorMaskBindGroupLayout.$.colorMasks.reverseHighlight;

  let colorMaskDebug = d.u32(0);
  let cumulativeMaskCheck = d.u32(0);
  const colorHSV = rgbToHSV(color.xyz);

  //TODO: optimize this more
  for (let i = 0; i < 16; i++) {
    if (usedMaskCount <= i) break;

    const mask = masks[i];
    const maskedColor = mask.baseColor;
    const rgbToleranceRange = mask.rgbToleranceRange;
    const useHSV = mask.useHSV;

    const hueToleranceRange = mask.hueToleranceRange;
    const hueUpper = hueToleranceRange.upper;
    const hueLower = hueToleranceRange.lower;

    const brightnessTolerance = mask.brightnessTolerance;
    const saturationTolerance = mask.saturationTolerance;
    const lowSaturationThreshold = mask.lowSaturationThreshold;
    const lowBrightnessThreshold = mask.lowBrightnessThreshold;

    const maskedColorLower = std.sub(maskedColor, rgbToleranceRange.lower);
    const maskedColorUpper = std.add(maskedColor, rgbToleranceRange.upper);
    const upperCheck = std.all(std.le(color.xyz, maskedColorUpper));
    const lowerCheck = std.all(std.ge(color.xyz, maskedColorLower));
    const rgbCheck = upperCheck && lowerCheck;

    const maskedHSV = rgbToHSV(maskedColor);

    let hueDiff = std.sub(colorHSV.x, maskedHSV.x);
    hueDiff = std.select(hueDiff, std.sub(hueDiff, 1.0), hueDiff > d.f32(0.5));
    hueDiff = std.select(hueDiff, std.add(hueDiff, 1.0), hueDiff < d.f32(-0.5));
    const lowerHueCheck = hueDiff >= -hueLower;
    const upperHueCheck = hueDiff <= hueUpper;
    let hueCheck = lowerHueCheck && upperHueCheck;

    const saturationDiff = std.abs(std.sub(colorHSV.y, maskedHSV.y));
    const saturationCheck = saturationDiff <= saturationTolerance;

    const brightnessDiff = std.abs(std.sub(colorHSV.z, maskedHSV.z));
    const brightnessCheck = brightnessDiff <= brightnessTolerance;

    const pixelIsGray = colorHSV.y < lowSaturationThreshold;
    const targetIsGray = maskedHSV.y < lowSaturationThreshold;

    const pixelIsBlack = colorHSV.z < lowBrightnessThreshold;
    const targetIsBlack = maskedHSV.z < lowBrightnessThreshold;

    //hue is unstable when either color is gray or black (low saturation or low brightness)
    //TODO: investigate the '||' operator usage, it seems to severely slow down the shader?
    const hueIsUnstable =
      pixelIsGray || targetIsGray || pixelIsBlack || targetIsBlack;

    hueCheck = std.select(hueCheck, d.bool(true), hueIsUnstable);

    const hsvCheck = hueCheck && saturationCheck && brightnessCheck;
    const maskCheck = std.select(rgbCheck, hsvCheck, useHSV === d.u32(1));
    cumulativeMaskCheck = cumulativeMaskCheck + d.u32(maskCheck);
    colorMaskDebug = colorMaskDebug + mask.debugMode;
  }

  const maskingLogic = std.select(
    cumulativeMaskCheck > 0,
    cumulativeMaskCheck === 0,
    reverseHighlight === 1
  );
  color = std.select(color, d.vec4f(color.xyz, 0.0), maskingLogic);
  //debug - shows masked areas coloring them red
  color = std.select(
    color,
    d.vec4f(1.0, 0.0, 0.0, 0.0),
    maskingLogic && colorMaskDebug > 0
  );
  return color;
});

export default colorMaskFragment;
