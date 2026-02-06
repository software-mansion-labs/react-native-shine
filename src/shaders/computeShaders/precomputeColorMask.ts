import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  COLOR_MASK_MAX_COUNT,
  colorMaskBindGroupLayout,
  precomputeColorMaskBindGroupLayout,
  sharedBindGroupLayout,
  type ColorMaskSchema,
} from './../bindGroupLayouts';
import { RGBToHSL } from '../colorConversions';

export const precomputeColorMask = tgpu['~unstable'].computeFn({
  in: { gid: d.builtin.globalInvocationId },
  workgroupSize: [8, 8, 1],
})((input) => {
  const x = input.gid.x;
  const y = input.gid.y;
  const size = std.textureDimensions(
    precomputeColorMaskBindGroupLayout.$.colorMaskStorage
  );

  if (x >= size.x || y >= size.y) return;
  let uv = d.vec2f(d.f32(x) / d.f32(size.x), d.f32(y) / d.f32(size.y));
  uv = d.vec2f(uv.x, 1.0 - uv.y);

  const colorSampled = std.textureSampleLevel(
    sharedBindGroupLayout.$.texture,
    sharedBindGroupLayout.$.sampler,
    uv,
    0
  );

  // let color = getPixelColorFromNonReversedVector(input.uv);

  const masks = colorMaskBindGroupLayout.$.colorMasks.masks;
  const usedMaskCount = colorMaskBindGroupLayout.$.colorMasks.usedMaskCount;
  const reverseHighlight =
    colorMaskBindGroupLayout.$.colorMasks.reverseHighlight;

  let colorMaskDebug = d.u32(0);
  let cumulativeMaskCheck = d.u32(0);
  const colorHSL = RGBToHSL(colorSampled.xyz);

  for (let i = 0; i < COLOR_MASK_MAX_COUNT; i++) {
    if (usedMaskCount <= i) break;

    const mask = masks[i] as ColorMaskSchema;
    const maskedColor = mask.baseColor;
    const rgbToleranceRange = mask.rgbToleranceRange;

    const maskedColorLower = std.sub(maskedColor, rgbToleranceRange.lower);
    const maskedColorUpper = std.add(maskedColor, rgbToleranceRange.upper);
    const upperCheck = std.all(std.le(colorSampled.xyz, maskedColorUpper));
    const lowerCheck = std.all(std.ge(colorSampled.xyz, maskedColorLower));
    const rgbCheck = upperCheck && lowerCheck;

    const saturationAndLightness = colorHSL.yz;
    const hueStart = mask.hueStart;
    const hueDiff = colorHSL.x - hueStart;
    const distance = std.mod(std.add(hueDiff, 360), 360);
    const hueCheck = std.step(distance, mask.hueRange);

    // step(min, val) -> returns 1.0, if val >= min
    // step(val, max) -> returns 1.0, if max >= val
    const checkVec = std.mul(
      std.step(mask.minLimits, saturationAndLightness),
      std.step(saturationAndLightness, mask.maxLimits)
    );

    const saturationAndLightnessMask = std.mul(checkVec.x, checkVec.y);

    const hslCheck = std.mul(hueCheck, saturationAndLightnessMask);

    const maskCheck = std.select(
      d.u32(rgbCheck),
      hslCheck,
      mask.useHSV === d.u32(1)
    );
    cumulativeMaskCheck = cumulativeMaskCheck + maskCheck;
    colorMaskDebug = colorMaskDebug + mask.debugMode;
  }

  const maskingLogic = std.select(
    cumulativeMaskCheck > 0,
    cumulativeMaskCheck === 0,
    reverseHighlight === 1
  );
  let color = std.select(
    colorSampled,
    d.vec4f(colorSampled.xyz, 0.0),
    maskingLogic
  );
  //debug - shows masked areas coloring them red
  color = std.select(
    color,
    d.vec4f(1.0, 0.0, 0.0, 0.0),
    maskingLogic && colorMaskDebug > 0
  );

  // store the calculated mask value in the storage texture
  std.textureStore(
    precomputeColorMaskBindGroupLayout.$.colorMaskStorage,
    d.vec2u(x, y),
    color
  );
});
