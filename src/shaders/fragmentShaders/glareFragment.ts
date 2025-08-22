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

export const glareFragment = tgpu['~unstable'].fragmentFn({
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

export const newGlareFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1.0);

  const rot = rotationValuesBindGroupLayout.$.vec;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y)); // do not change

  const opts = glareOptionsBindGroupLayout.$.glareOptions;
  const glareIntensity = opts.glareIntensity; // [0..∞): bigger → wider/stronger area
  const glowPower = opts.glowPower; // (0..∞): curve shaping; bigger → softer/wider glow
  const hueBlendPower = opts.hueBlendPower; // [0..1+]: how much hue-shifted color blends in
  const hueShiftAngleMin = opts.hueShiftAngleMin; // radians
  const hueShiftAngleMax = opts.hueShiftAngleMax; // radians
  const lightIntensity = opts.lightIntensity; // [0..∞): brightness boost of the glare/bloom

  let color = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  const dist = std.distance(center, centeredCoords);
  const radial = std.exp(-dist); // (0,1], steeper near center
  const radialScaled = std.mul(
    radial,
    std.add(1.0, std.max(0.0, glareIntensity))
  );
  const influenceRaw = std.smoothstep(0.0, 1.0, radialScaled); // 0..1
  const curveExp = std.clamp(glowPower, 0.05, 64.0);
  const glowMask = std.pow(influenceRaw, std.div(1.0, curveExp)); // 0..1

  const maskedGlow = std.mul(glowMask, color.w); // 0..1
  const boostedRGB = glareColorShift(color.xyz, maskedGlow);

  const hueT = std.clamp(maskedGlow, 0.0, 1.0);
  const hueAngle = std.mix(hueShiftAngleMin, hueShiftAngleMax, hueT);
  const hueShifted = hueShift(boostedRGB, hueAngle);

  const hueMixWeight = std.clamp(
    std.mul(hueBlendPower / 5.0, maskedGlow),
    0.0,
    1.0
  );
  const chromaMixed = std.mix(color.xyz, hueShifted, hueMixWeight);

  const glareStrength = std.clamp(lightIntensity, 0.0, 100.0);
  const glareLayer = std.mul(d.vec3f(maskedGlow), glareStrength);

  const overlaidRGB = overlayChannels(chromaMixed, glareLayer);
  const finalRGB = std.mix(chromaMixed, overlaidRGB, d.vec3f(maskedGlow));

  // Optional mild safety clamp to avoid NaNs/overflow artifacts.
  const outRGB = std.clamp(finalRGB, d.vec3f(0.0), d.vec3f(1.0));

  return d.vec4f(outRGB, color.w);
});
