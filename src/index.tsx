import { useOrientation } from './hooks/useOrientation';
import {
  getAngleFromDimensions,
  subscribeToOrientationChange,
} from './shaders/utils';

export { subscribeToOrientationChange, getAngleFromDimensions, useOrientation };
export { Shine } from './components/Shine';
export { ShineGroup } from './components/ShineGroup';
export type { ShineProps } from './components/Shine';
