import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import { maskTextureBindGroupLayout } from '../bindGroupLayouts';
import { getPixelColorFromVector } from '../tgpuUtils';

const maskFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const texcoord = d.vec2f(input.uv.x, 1.0 - input.uv.y);

  const mask = std.textureSample(
    maskTextureBindGroupLayout.$.texture,
    maskTextureBindGroupLayout.$.sampler,
    texcoord
  );
  const reversedMask = d.vec4f(std.sub(1.0, mask.xyz), mask.w);

  let color = getPixelColorFromVector(texcoord);

  return d.vec4f(color.xyz, reversedMask.x);
});

export default maskFragment;
