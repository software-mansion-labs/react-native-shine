import type { V3d } from '../types/vector';

export function scale(a: V3d, value: number) {
  return {
    x: value * a.x,
    y: value * a.y,
    z: value * a.z,
  };
}

export const multiply = scale;

export function div(a: V3d, value: number) {
  return multiply(a, 1 / value);
}

export function negate(a: V3d) {
  return scale(a, -1);
}

export function add(a: V3d, b: V3d) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

export function subtract(a: V3d, b: V3d) {
  return add(a, negate(b));
}

export function toComponents({ x, y, z }: V3d): [number, number, number] {
  return [x, y, z];
}

export const zero = { x: 0, y: 0, z: 0 };
