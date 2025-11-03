import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  textureBindGroupLayout,
  colorMaskBindGroupLayout,
} from '../bindGroupLayouts';
import { rgbToHSV } from '../tgpuUtils';

const colorMaskFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);

  const mask = colorMaskBindGroupLayout.$.mask;
  const maskedColor = mask.baseColor;
  const rgbToleranceRange = mask.rgbToleranceRange;
  const useHSV = mask.useHSV;

  // const hueToleranceRange = mask.hueToleranceRange;
  const hueUpper = mask.hueToleranceAngleUpper;
  const hueLower = mask.hueToleranceAngleLower;

  const brightnessTolerance = mask.brightnessTolerance;
  const saturationTolerance = mask.saturationTolerance;
  const lowSaturationThreshold = mask.lowSaturationThreshold;
  const lowBrightnessThreshold = mask.lowBrightnessThreshold;

  let color = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  const maskedColorLower = std.sub(maskedColor, rgbToleranceRange.lower);
  const maskedColorUpper = std.add(maskedColor, rgbToleranceRange.upper);
  const upperCheck = std.all(std.le(color.xyz, maskedColorUpper));
  const lowerCheck = std.all(std.ge(color.xyz, maskedColorLower));
  const rgbCheck = upperCheck && lowerCheck;

  const maskedHSV = rgbToHSV(maskedColor);
  const colorHSV = rgbToHSV(color.xyz);

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
  const hueIsUnstable =
    pixelIsGray || targetIsGray || pixelIsBlack || targetIsBlack;

  hueCheck = std.select(hueCheck, d.bool(true), hueIsUnstable);

  const hsvCheck = hueCheck && saturationCheck && brightnessCheck;
  const maskCheck = std.select(rgbCheck, hsvCheck, useHSV === d.u32(1));

  color = std.select(color, d.vec4f(color.xyz, 0.0), maskCheck);
  return color;
});

export default colorMaskFragment;
