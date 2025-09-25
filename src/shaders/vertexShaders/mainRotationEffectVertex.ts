import tgpu from 'typegpu';
import * as std from 'typegpu/std';
import * as d from 'typegpu/data';
import { rotationBindGroupLayout } from '../bindGroupLayouts';

const mainRotationEffectVertex = tgpu['~unstable'].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: { position: d.builtin.position, uv: d.vec2f },
})((input) => {
  const rot = rotationBindGroupLayout.$.vec;

  // Maximum rotation angles in radians
  const maxAngle = d.f32((25.0 * Math.PI) / 180.0);
  const ax = d.f32(-rot.y * maxAngle); // rotateX depends on vertical touch
  const ay = d.f32(-rot.x * 1.0); // rotateY depends on horizontal touch

  const positions: d.v2f[] = [
    d.vec2f(-1.0, -1.0),
    d.vec2f(1.0, 1.0),
    d.vec2f(1.0, -1.0),
    d.vec2f(-1.0, -1.0),
    d.vec2f(-1.0, 1.0),
    d.vec2f(1.0, 1.0),
  ];

  const uvs: d.v2f[] = [
    d.vec2f(0.0, 0.0),
    d.vec2f(1.0, 1.0),
    d.vec2f(1.0, 0.0),
    d.vec2f(0.0, 0.0),
    d.vec2f(0.0, 1.0),
    d.vec2f(1.0, 1.0),
  ];

  const index = input.vertexIndex;
  const pos = d.vec3f(positions[index] as d.v2f, 0.0);

  const pivot = d.vec3f(rot.x, rot.y, 0.0);

  const relative = std.sub(pos, pivot);
  const cosX = std.cos(ax);
  const sinX = std.sin(ax);
  const rotatedX = d.vec3f(
    relative.x,
    cosX * relative.y - sinX * relative.z,
    sinX * relative.y + cosX * relative.z
  );

  const cosY = std.cos(ay);
  const sinY = std.sin(ay);
  const rotatedXY = d.vec3f(
    cosY * rotatedX.x + sinY * rotatedX.z,
    rotatedX.y,
    -sinY * rotatedX.x + cosY * rotatedX.z
  );

  const finalPos3D = std.add(rotatedXY, pivot);
  const perspective = 100.0;
  const zOffset = 2.5;
  const z = finalPos3D.z + zOffset;
  const persp = perspective / (perspective + z);

  const finalPos = d.vec4f(
    finalPos3D.x * persp,
    finalPos3D.y * persp,
    0.0,
    1.0
  );

  return {
    position: finalPos,
    uv: uvs[index] as d.v2f,
  };
});

export default mainRotationEffectVertex;
