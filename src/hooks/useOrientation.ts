import { useEffect, useState } from 'react';
import { subscribeToOrientationChange } from '../shaders/utils';

type Orientation = 'LANDSCAPE' | 'PORTRAIT';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>();

  useEffect(
    () =>
      subscribeToOrientationChange((isLandscape) =>
        setOrientation(isLandscape ? 'LANDSCAPE' : 'PORTRAIT')
      ),
    []
  );

  return orientation;
};
