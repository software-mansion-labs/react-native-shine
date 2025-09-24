import { Dimensions } from 'react-native';
import type { quaternion, vec3 } from '../types/types';

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

// Simple helper to get angle from dimensions (0 or 90)
export function getAngleFromDimensions() {
  return 90 * Number(isLandscapeMode());
}

export function isLandscapeMode() {
  const { width, height } = Dimensions.get('window');

  return width >= height;
}

// Subscribe to orientation change via Dimensions API only
export function subscribeToOrientationChange(
  callback: (isLandscape: boolean) => void
) {
  const handler = () => callback(isLandscapeMode());
  const subscription = Dimensions.addEventListener('change', handler);

  handler();

  return () => subscription.remove();
}
