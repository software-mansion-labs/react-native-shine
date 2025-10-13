import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  rotationBindGroupLayout,
  textureBindGroupLayout,
} from '../bindGroupLayouts';
import { hueShift } from '../tgpuUtils';
import { waveCallbackSlot } from '../../enums/waveCallback';

export const holoFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = texcoord;
  const textureColor = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );
  const rot = rotationBindGroupLayout.$.vec;

  const wave = waveCallbackSlot.$(rot.xy);
  const waveX = wave.x;
  const waveY = wave.y;

  const band = std.add(0.2 * waveX * uv.x, 2 * waveY * uv.y);

  const hueAngle = std.mul(std.abs(band), (10 * Math.PI * rot.x) / 3);
  const rainbowColor = hueShift(d.vec3f(1.0, 1.0, 1.0), hueAngle);
  const finalColor = std.mul(rainbowColor, 1.0);

  return d.vec4f(finalColor, 0.7 * textureColor.w);
});
