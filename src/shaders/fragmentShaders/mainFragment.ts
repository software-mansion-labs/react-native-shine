import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  rotationValuesBindGroupLayout,
  textureBindGroupLayout,
} from '../bindGroupLayouts';

const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const uv = d.vec2f(input.uv.x, 1.0 - input.uv.y);
  const centeredCoords = std.sub(std.mul(uv, 2.0), 1); //-1 to 1

  const rot = rotationValuesBindGroupLayout.$.vec;
  const center = std.add(d.vec2f(0.0), d.vec2f(rot.y, rot.x));

  let color = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  const glowPower = d.f32(1.0);
  let glow = d.vec4f(std.sub(1.5, std.distance(center, centeredCoords)));
  glow = std.mul(glow, glowPower);

  color = std.add(color, glow);
  return color;
});

export default mainFragment;
