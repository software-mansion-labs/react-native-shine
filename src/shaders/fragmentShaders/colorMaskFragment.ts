import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  textureBindGroupLayout,
  colorMaskBindGroupLayout,
} from '../bindGroupLayouts';

const colorMaskFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);

  const mask = colorMaskBindGroupLayout.$.mask;
  const maskedColor = mask.baseColor;
  const rgbToleranceRange = mask.rgbToleranceRange;

  let color = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  const maskedColorLower = std.sub(maskedColor, rgbToleranceRange.lower);
  const maskedColorUpper = std.add(maskedColor, rgbToleranceRange.upper);
  const upperCheck = std.all(std.le(color.xyz, maskedColorUpper));
  const lowerCheck = std.all(std.ge(color.xyz, maskedColorLower));
  if (upperCheck && lowerCheck) {
    return d.vec4f(color.xyz, 0.0);
  }
  return d.vec4f(color.xyz, color.w);
});

export default colorMaskFragment;
