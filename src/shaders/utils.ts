import {
  type TgpuBuffer,
  type TgpuRoot,
  type TgpuTexture,
  type UniformFlag,
} from 'typegpu';
import * as d from 'typegpu/data';
import { rotationValuesBindGroupLayout } from './bindGroupLayouts';
import type { quaternion, vec3 } from '../types/types';
import { Dimensions } from 'react-native';

export const createTexture = async (
  root: TgpuRoot,
  size: {
    width: number;
    height: number;
  }
): Promise<TgpuTexture> => {
  const texture = root['~unstable']
    .createTexture({
      size: [size.width, size.height],
      format: 'rgba8unorm',
    })
    .$usage('sampled', 'render');

  return texture;
};

export const loadTexture = async (
  root: TgpuRoot,
  imageBitmap: ImageBitmap,
  texture: TgpuTexture
) => {
  root.device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: root.unwrap(texture) },
    [imageBitmap.width, imageBitmap.height]
  );
};

export const createRotationBuffer = (
  root: TgpuRoot,
  initValues?: { x: number; y: number; z: number }
) => {
  const init = initValues
    ? d.vec3f(initValues.x, initValues.y, initValues.z)
    : d.vec3f(0.0);
  const rotationValuesBuffer = root
    .createBuffer(d.vec3f, init)
    .$usage('uniform');

  return rotationValuesBuffer;
};

export const createRotationValuesBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<d.Vec3f> & UniformFlag
) => {
  const rotationValuesBindGroup = root.createBindGroup(
    rotationValuesBindGroupLayout,
    {
      vec: buffer,
    }
  );

  return rotationValuesBindGroup;
};

export const rotateVectorByQuaternion = (
  vec: vec3,
  quaternion: quaternion
): vec3 => {
  'worklet';
  const t: vec3 = [
    quaternion[1] * vec[2] - quaternion[2] * vec[1],
    quaternion[2] * vec[0] - quaternion[0] * vec[2],
    quaternion[0] * vec[1] - quaternion[1] * vec[0],
  ];

  // t2 = qw * forward + t
  const t2: vec3 = [
    quaternion[3] * vec[0] + t[0],
    quaternion[3] * vec[1] + t[1],
    quaternion[3] * vec[2] + t[2],
  ];

  const crossQT2: vec3 = [
    quaternion[1] * t2[2] - quaternion[2] * t2[1],
    quaternion[2] * t2[0] - quaternion[0] * t2[2],
    quaternion[0] * t2[1] - quaternion[1] * t2[0],
  ];

  // rotated = vec + 2.0 * cross(q, t2)
  const rotated: vec3 = [
    vec[0] + 2.0 * crossQT2[0],
    vec[1] + 2.0 * crossQT2[1],
    vec[2] + 2.0 * crossQT2[2],
  ];

  return [rotated[0], rotated[1], rotated[2]];
};

export const clamp = (v: number, min = -1, max = 1) => {
  'worklet';
  return Math.max(min, Math.min(max, v));
};

export const rotate2D = (
  [x, y]: [number, number],
  angleDeg: number
): [number, number] => {
  'worklet';
  const rad = (angleDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [x * c - y * s, x * s + y * c];
};

/* ---------- Orientation helpers ---------- */
let ScreenOrientation: any = null;
try {
  ScreenOrientation = require('expo-screen-orientation');
} catch {
  ScreenOrientation = null;
}

export function expoOrientationToAngle(orientation: number) {
  if (!ScreenOrientation) return 0;
  const OR = ScreenOrientation.Orientation;
  switch (orientation) {
    case OR.PORTRAIT_UP:
      return 0;
    case OR.LANDSCAPE_LEFT:
      return 270;
    case OR.PORTRAIT_DOWN:
      return 180;
    case OR.LANDSCAPE_RIGHT:
      return 90;
    default:
      return 0;
  }
}

// Simple helper to get angle from dimensions (0 or 90)
export function getAngleFromDimensions() {
  const { width, height } = Dimensions.get('window');
  return width >= height ? 90 : 0;
}

// Subscribe to orientation change via Dimensions API only
export function subscribeToOrientationChange(
  callback: (angleDeg: number) => void
) {
  callback(getAngleFromDimensions());

  const handler = () => {
    callback(getAngleFromDimensions());
  };

  const dimSub = Dimensions.addEventListener('change', handler);

  return () => {
    dimSub?.remove();
  };
}
