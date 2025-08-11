import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  rotationValuesBindGroupLayout,
  textureBindGroupLayout,
} from '../bindGroupLayouts';
import { hueShift } from '../tgpuUtils';

const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1); //-1 to 1

  const rot = rotationValuesBindGroupLayout.$.vec;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.x, rot.y));

  const color = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  const glowPower = d.f32(1.0);
  const hueAngle = d.f32(0.2);
  const dist = std.distance(center, centeredCoords);
  let glowSize = std.clamp(
    d.vec4f(std.sub(1.5, dist)),
    d.vec4f(0.0),
    d.vec4f(1.0)
  );
  glowSize = std.mul(glowSize, glowPower * color.w);

  const shiftedRBG = hueShift(color.xyz, hueAngle);
  const finalRGB = std.mix(color.xyz, shiftedRBG, glowSize.xyz);

  return d.vec4f(finalRGB, color.w);
});

export default mainFragment;
