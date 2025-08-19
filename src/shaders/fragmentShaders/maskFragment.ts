import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import {
  textureBindGroupLayout,
  maskTextureBindGroupLayout,
} from '../bindGroupLayouts';

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

  let color = std.textureSample(
    textureBindGroupLayout.$.texture,
    textureBindGroupLayout.$.sampler,
    texcoord
  );

  if (!std.allEq(mask.xyz, d.vec3f(0.0, 0.0, 0.0))) {
    return color; //i need to add intermediate texture for passing the previous state
  }

  std.discard();
  return d.vec4f(1.0);
});

export default maskFragment;
