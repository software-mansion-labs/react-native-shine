import tgpu from 'typegpu';
import * as d from 'typegpu/data';

const blue = d.vec4f(0.114, 0.447, 0.941, 1);
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { uv: d.vec2f },
  out: d.vec4f,
})(() => {
  return blue;
});

export default mainFragment;
