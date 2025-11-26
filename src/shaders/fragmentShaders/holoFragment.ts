import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import { sharedBindGroupLayout } from '../bindGroupLayouts';
import { getPixelColorFromVector, hueShift } from '../tgpuUtils';
import { waveCallbackSlot } from '../../enums/waveCallback';

export const holoFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const textureColor = getPixelColorFromVector(uv);
  const rot = sharedBindGroupLayout.$.rot;

  const wave = waveCallbackSlot.$(rot.xy);
  const waveX = wave.x;
  const waveY = wave.y;

  const band = std.add(waveX * uv.x, waveY * uv.y * 2.0);
  // const band = waveX * uv.x;

  //TODO: fix holo
  const frequency = d.f32(1.0);
  const hueAngle = d.f32(180) * std.mul(band, frequency * Math.PI * rot.x);
  const rainbowColor = hueShift(d.vec3f(uv.x, 0.0, 0.0), hueAngle);
  const finalColor = std.mul(rainbowColor, 1.0);

  // console.log('\ncurrentColor = (', rainbowColor.xyz, ')');
  // console.log('hueAngle = ', hueAngle);
  // console.clear();
  return d.vec4f(finalColor, 0.9 * textureColor.w);
});
