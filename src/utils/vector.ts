import type { Transformer, V2d, V3d } from '../types/vector';

// 2d
export function scaleV2d(a: V2d, value: number): V2d {
  return {
    x: value * a.x,
    y: value * a.y,
  };
}

export const multiplyV2d = scaleV2d;

export function addV2d(a: V2d, b: V2d): V2d {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function angleToV2d(angle: number): V2d {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function rotateV2d({ x, y }: V2d, rad: number): V2d {
  const { x: c, y: s } = angleToV2d(rad);

  return { x: x * c - y * s, y: x * s + y * c };
}

export function negateV2dX({ x, y }: V2d): V2d {
  return { x: -x, y };
}

export function negateV2dY({ x, y }: V2d): V2d {
  return { x, y: -y };
}

export function transformV2d({ x, y }: V2d, transformer: Transformer): V2d {
  return {
    x: transformer(x),
    y: transformer(y),
  };
}

export function clampV2d(v2d: V3d, min: number, max: number): V2d {
  return transformV2d(v2d, (value) => clamp(value, min, max));
}

export const zeroV2d = { x: 0, y: 0 };

// 3d
export function scaleV3d(a: V3d, value: number): V3d {
  return {
    ...scaleV2d(a, value),
    z: value * a.z,
  };
}

export const multiplyV3d = scaleV3d;

export function divV3d(a: V3d, value: number): V3d {
  return multiplyV3d(a, 1 / value);
}

export function negateV3d(a: V3d): V3d {
  return scaleV3d(a, -1);
}

export function addV3d(a: V3d, b: V3d): V3d {
  return {
    ...addV2d(a, b),
    z: a.z + b.z,
  };
}

export function subtractV3d(a: V3d, b: V3d): V3d {
  return addV3d(a, negateV3d(b));
}

export function componentsFromV3d({ x, y, z }: V3d): [number, number, number] {
  return [x, y, z];
}

export function transformV3d(v3d: V3d, transformer: Transformer): V3d {
  return {
    ...transformV2d(v3d, transformer),
    z: transformer(v3d.z),
  };
}

export function clampV3d(v3d: V3d, min: number, max: number): V3d {
  return transformV3d(v3d, (value) => clamp(value, min, max));
}

// helpers

export function clamp(v: number, min = -1, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export const zeroV3d = { x: 0, y: 0, z: 0 };
