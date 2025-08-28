import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  rotationValuesBindGroupLayout,
  textureBindGroupLayout,
} from '../bindGroupLayouts';
import { hueShift } from '../tgpuUtils';

export const rainbowHoloFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = texcoord;
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1.0);

  const textureColor = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  const rot = rotationValuesBindGroupLayout.$.vec;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y));

  const waveX = std.sin(centeredCoords.x * 2.0);
  const waveY = std.cos(centeredCoords.x * 2.0);
  const band = std.add(waveX, waveY);

  const dist = std.distance(centeredCoords, center);
  const glowPower = 0.7;
  const falloff = std.pow(std.exp(-dist), 1.0 / glowPower);

  const hueAngle = std.mul(std.abs(band), (10 * Math.PI * rot.x) / 3);
  const rainbowColor = hueShift(d.vec3f(1.0, 1.0, 1.0), hueAngle);
  const finalColor = std.mul(rainbowColor, falloff);

  return d.vec4f(finalColor, 1 - falloff * dist * textureColor.w);
});
