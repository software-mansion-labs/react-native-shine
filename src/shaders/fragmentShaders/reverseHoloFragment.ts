import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  textureBindGroupLayout,
  maskTextureBindGroupLayout,
  rotationBindGroupLayout,
  glareBindGroupLayout,
} from '../bindGroupLayouts';
import { hueShift } from '../tgpuUtils';

export const reverseHoloFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = texcoord;
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1.0);

  const rot = rotationBindGroupLayout.$.vec;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y)); // center from device orientation/touch

  const opts = glareBindGroupLayout.$.glareOptions;
  const glareIntensity = opts.glareIntensity;
  const glowPower = opts.glowPower;
  const hueBlendPower = opts.hueBlendPower;
  const hueShiftAngleMin = opts.hueShiftAngleMin;
  const hueShiftAngleMax = opts.hueShiftAngleMax;
  const lightIntensity = opts.lightIntensity;

  const cardColor = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  const holoMaskColor = std.textureSample(
    maskTextureBindGroupLayout.$.texture,
    maskTextureBindGroupLayout.$.sampler,
    texcoord
  );

  const dist = std.distance(centeredCoords, center);
  const rFalloff = std.exp(-dist);
  const scaledRadial = std.mul(
    rFalloff,
    std.add(1.0, std.max(0.0, glareIntensity))
  );
  const influence = std.smoothstep(0.0, 1.0, scaledRadial);
  const curvePower = std.clamp(glowPower, 0.05, 64.0);
  const glowMask = std.pow(influence, std.div(1.0, curvePower));

  const holoFactor =
    (1.0 - holoMaskColor.x) * holoMaskColor.w * std.pow(scaledRadial, 1.5);

  const maskedGlow = std.mul(glowMask, holoFactor); // only affect masked areas

  const hueAmount = std.mix(
    hueShiftAngleMin,
    hueShiftAngleMax,
    std.clamp(maskedGlow, 0.0, 1.0)
  );
  const sparkleHue = hueShift(cardColor.xyz, hueAmount);
  const hueMixAmt = std.clamp((hueBlendPower / 5.0) * maskedGlow, 0.0, 1.0);
  const chromaMix = std.mix(cardColor.xyz, sparkleHue, hueMixAmt);

  const shineStrength = std.clamp(lightIntensity, 1.0, 100.0);
  const shineLayer = std.mul(chromaMix, 1.5 * shineStrength * maskedGlow);

  return d.vec4f(shineLayer, 1 - maskedGlow);
});
