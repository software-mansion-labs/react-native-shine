import tgpu from 'typegpu';
import * as d from 'typegpu/data';

const mainVertex = tgpu['~unstable'].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: { position: d.builtin.position, uv: d.vec2f },
})((input) => {
  const position: d.v2f[] = [
    d.vec2f(-1.0, -1.0), // bottom left
    d.vec2f(1.0, 1.0), // top right
    d.vec2f(1.0, -1.0), // bottom right
    d.vec2f(-1.0, -1.0), // bottom left
    d.vec2f(-1.0, 1.0), // top left
    d.vec2f(1.0, 1.0), // top right
  ];

  const uv: d.v2f[] = [
    d.vec2f(0.0, 0.0),
    d.vec2f(1.0, 1.0),
    d.vec2f(1.0, 0.0),
    d.vec2f(0.0, 0.0),
    d.vec2f(0.0, 1.0),
    d.vec2f(1.0, 1.0),
  ];

  const index = input.vertexIndex;
  const pos = position[index] as d.v2f;

  return {
    position: d.vec4f(pos.xy, 0.0, 1.0),
    uv: uv[index] as d.v2f,
  };
});

export default mainVertex;
