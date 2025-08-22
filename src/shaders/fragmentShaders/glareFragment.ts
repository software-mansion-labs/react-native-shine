import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  rotationValuesBindGroupLayout,
  textureBindGroupLayout,
  glareOptionsBindGroupLayout,
  // colorMaskBindGroupLayout,
} from '../bindGroupLayouts';
import { glareColorShift, hueShift, overlayChannels } from '../tgpuUtils';

const glareFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1); //-1 to 1

  const rot = rotationValuesBindGroupLayout.$.vec;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y));

  const glareOptions = glareOptionsBindGroupLayout.$.glareOptions;
  const glareIntensity = glareOptions.glareIntensity;
  const glowPower = glareOptions.glowPower;
  const hueBlendPower = glareOptions.hueBlendPower;
  const hueShiftAngleMax = glareOptions.hueShiftAngleMax;
  const hueShiftAngleMin = glareOptions.hueShiftAngleMin;
  const lightIntensity = glareOptions.lightIntensity;

  // const mask = colorMaskBindGroupLayout.$.mask;
  // const maskedColor = mask.baseColor;
  // const rgbToleranceRange = mask.rgbToleranceRange;

  let color = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  // const maskedColorLower = std.sub(maskedColor, rgbToleranceRange.lower);
  // const maskedColorUpper = std.add(maskedColor, rgbToleranceRange.upper);
  // const upperCheck = std.all(std.le(color.xyz, maskedColorUpper));
  // const lowerCheck = std.all(std.ge(color.xyz, maskedColorLower));
  // if (upperCheck && lowerCheck) {
  //   return color;
  // }

  //glareIntensity
  const dst = std.exp(-std.distance(center, centeredCoords));
  const distToCenter = std.smoothstep(0.0, 1 / glareIntensity, dst);

  //glowPower
  let glow = d.vec3f(distToCenter);
  glow = std.mul(glow, glowPower * color.w);

  //hueBlend
  const hueBlend = (d.f32(hueBlendPower) * dst) / 10.0;

  //lightIntensity
  glow = std.add(glow, lightIntensity / 10.0);
  let shiftedRGB = glareColorShift(color.xyz, dst / (lightIntensity * 2));

  //hueShiftAngleMin/Max
  const hueShiftAngle = std.smoothstep(
    hueShiftAngleMin,
    hueShiftAngleMax,
    distToCenter
  );
  const shiftedHue = hueShift(shiftedRGB, hueShiftAngle);
  shiftedRGB = overlayChannels(shiftedRGB, shiftedHue);

  color = d.vec4f(std.mix(color.xyz, shiftedRGB, hueBlend), color.w);
  const baseColor = color;
  const blendColor = glow;

  const combined = overlayChannels(baseColor.xyz, blendColor);
  color = d.vec4f(std.mix(color.xyz, combined, glow), color.w);

  return color;
});

export default glareFragment;
