import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import { precomputeColorMaskOutputBindGroupLayout } from '../bindGroupLayouts';

// TODO: add possibility of inclusive and exclusive masks at the same time
const colorMaskFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  const size = std.textureDimensions(
    precomputeColorMaskOutputBindGroupLayout.$.colorMaskOutput
  );
  const coords = d.vec2u(
    input.uv.x * d.f32(size.x),
    input.uv.y * d.f32(size.y)
  );

  let color = std.textureLoad(
    precomputeColorMaskOutputBindGroupLayout.$.colorMaskOutput,
    coords,
    1
  );

  return color;
});

export default colorMaskFragment;
