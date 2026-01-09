import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  precomputeColorMaskBindGroupLayout,
  sharedBindGroupLayout,
} from './../bindGroupLayouts';

export const precomputeColorMask = tgpu['~unstable'].computeFn({
  in: { gid: d.builtin.globalInvocationId },
  workgroupSize: [8, 8, 1],
})((input) => {
  const x = input.gid.x;
  const y = input.gid.y;
  const colorMaskStorageTexture =
    precomputeColorMaskBindGroupLayout.$.colorMaskStorage;
  const size = std.textureDimensions(colorMaskStorageTexture);

  console.log('precomputing color mask at', x, y);
  if (x >= size.x || y >= size.y) return;
  const uv = d.vec2f(d.f32(x) / d.f32(size.x), d.f32(y) / d.f32(size.y));

  const colorSampled = std.textureSample(
    sharedBindGroupLayout.$.texture,
    sharedBindGroupLayout.$.sampler,
    uv
  );

  std.textureStore(
    precomputeColorMaskBindGroupLayout.$.colorMaskStorage,
    d.vec2u(x, y),
    d.vec4f(colorSampled)
  );
});
