import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  rotationValuesBindGroupLayout,
  textureBindGroupLayout,
} from '../bindGroupLayouts';
import { bloomColorShift, hueShift, overlayChannels } from '../tgpuUtils';

const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1); //-1 to 1

  const rot = rotationValuesBindGroupLayout.$.vec;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y));

  let color = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  const glowPower = d.f32(1.0);
  const dst = std.exp(-std.distance(center, centeredCoords) + 0.1);
  const distToCenter = std.smoothstep(0.0, 1.0, dst);

  let glow = d.vec3f(distToCenter);
  glow = std.mul(glow, glowPower * color.w);

  const hueShiftAngle = distToCenter;
  let shiftedRGB = bloomColorShift(color.xyz, dst / 10);
  const shiftedHue = hueShift(shiftedRGB, hueShiftAngle);
  shiftedRGB = overlayChannels(shiftedRGB, shiftedHue);

  color = d.vec4f(std.mix(color.xyz, shiftedRGB, glow), color.w);

  const baseColor = color;
  const blendColor = glow;

  const combined = overlayChannels(baseColor.xyz, blendColor);

  // color = d.vec4f(std.add(color.xyz, glow / 10), color.w);
  color = d.vec4f(std.mix(color.xyz, combined, glow), color.w);
  return color;
});

export default mainFragment;
