import type { Size } from '../types/size';
import type { V2d } from '../types/vector';

export function sizeToV2d({ width: x, height: y }: Size): V2d {
  'worklet';
  return { x, y };
}

export function sizeFromV2d({ x: width, y: height }: V2d): Size {
  'worklet';
  return { width, height };
}
