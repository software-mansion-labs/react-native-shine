import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  sharedBindGroupLayout,
  glareBindGroupLayout,
} from '../bindGroupLayouts';
import {
  getPixelColorFromVector,
  glareColorShift,
  hueShift,
  overlayChannels,
} from '../tgpuUtils';

export const glareFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1.0);

  const rot = sharedBindGroupLayout.$.rot;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y)); // do not change

  const opts = glareBindGroupLayout.$.glareOptions;
  const glareIntensity = opts.glareIntensity; // [0..∞): bigger → wider/stronger area
  const glowPower = opts.glowPower; // (0..∞): curve shaping; bigger → softer/wider glow
  const lightIntensity = opts.lightIntensity / 1.3; // [0..∞): brightness boost of the glare/bloom

  const glareColor = opts.glareColor;
  const hueBlendPower = glareColor.hueBlendPower; // [0..1+]: how much hue-shifted color blends in
  const hueShiftAngleMin = glareColor.hueShiftAngleMin; // degrees
  const hueShiftAngleMax = glareColor.hueShiftAngleMax; // degrees

  let color = getPixelColorFromVector(uv);

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

  const outRGB = std.clamp(finalRGB, d.vec3f(0.0), d.vec3f(1.0));

  return d.vec4f(outRGB, color.w);
});
