import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  maskTextureBindGroupLayout,
  reverseHoloDetectionChannelFlagsBindGroupLayout,
  sharedBindGroupLayout,
} from '../bindGroupLayouts';
import { getPixelColorFromVector, hueShift, rgbToHSV } from '../tgpuUtils';

export const reverseHoloFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = texcoord;
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1.0);

  const rot = sharedBindGroupLayout.$.rot;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y)); // center from device orientation/touch

  // glare options---------------------------------
  const opts = reverseHoloDetectionChannelFlagsBindGroupLayout.$.glareOptions;
  const glareIntensity = opts.glareIntensity;
  const glowPower = opts.glowPower;
  const lightIntensity = opts.lightIntensity;

  const glareColor = opts.glareColor;
  const hueBlendPower = glareColor.hueBlendPower;
  const hueShiftAngleMin = glareColor.hueShiftAngleMin;
  const hueShiftAngleMax = glareColor.hueShiftAngleMax;
  //-----------------------------------------------

  // detection channel flags-----------------------
  const detectionChannelFlags =
    reverseHoloDetectionChannelFlagsBindGroupLayout.$.channelFlags;
  const redChannelFlag = detectionChannelFlags.redChannel;
  const greenChannelFlag = detectionChannelFlags.greenChannel;
  const blueChannelFlag = detectionChannelFlags.blueChannel;
  const hueFlag = detectionChannelFlags.hue;
  const saturationFlag = detectionChannelFlags.saturation;
  const valueFlag = detectionChannelFlags.value;
  //------------------------------------------------

  const cardColor = getPixelColorFromVector(texcoord);

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
  const holoMaskColorHSV = rgbToHSV(holoMaskColor.xyz);

  const rgbSelection = d.vec3f(
    redChannelFlag,
    greenChannelFlag,
    blueChannelFlag
  );
  const channelFactor = std.dot(holoMaskColor.xyz, rgbSelection);

  const hsvSelection = d.vec3f(hueFlag, saturationFlag, valueFlag);
  const channelFactorHSV = std.dot(holoMaskColorHSV.xyz, hsvSelection);
  //TODO: delete this combination to have separate RGB and HSV controls,
  //      maybe add weights later or choice of combination method
  const channelFactorCombined = std.mix(channelFactor, channelFactorHSV, 0.0);

  const holoFactor =
    (1.0 - channelFactorCombined) *
    holoMaskColor.w *
    std.pow(scaledRadial, 1.5);

  // const decayedGlowMask = std.exp(1.0 - glowMask);
  const maskedGlow = std.pow(std.mul(glowMask, holoFactor), 2.0); // only affect masked areas

  const hueAmount = std.mix(
    hueShiftAngleMin,
    hueShiftAngleMax,
    std.clamp(maskedGlow, 0.0, 1.0)
  );
  const sparkleHue = hueShift(cardColor.xyz, hueAmount);
  const shineStrength = std.clamp(lightIntensity, 1.0, 100.0);
  const shineIntensity = 1.5 * shineStrength * maskedGlow;

  const hueMixAmt = std.clamp((hueBlendPower / 5.0) * maskedGlow, 0.0, 1.0);
  const chromaMix = std.mix(cardColor.xyz, sparkleHue, hueMixAmt);

  const shineLayer = std.mul(chromaMix, shineIntensity);

  return d.vec4f(d.vec3f(shineLayer), 1.0 - maskedGlow);
});
