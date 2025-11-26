import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { getPixelColorFromNonReversedVector } from '../tgpuUtils';

export const baseTextureFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})((input) => {
  return getPixelColorFromNonReversedVector(input.uv);
});
