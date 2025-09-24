import { useOrientation } from './hooks/useOrientation';
import {
  getAngleFromDimensions,
  isLandscapeMode,
  subscribeToOrientationChange,
} from './shaders/utils';

export {
  subscribeToOrientationChange,
  getAngleFromDimensions,
  isLandscapeMode,
  useOrientation,
};
export { Shine } from './components/Shine';
export { ShineGroup } from './components/ShineGroup';
export type { ShineProps } from './components/Shine';
export * from './utils/vector';
export type { V2d, V3d } from './types/vector';
