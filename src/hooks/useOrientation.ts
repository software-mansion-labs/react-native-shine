import { useEffect, useState } from 'react';
import {
  getAngleFromDimensions,
  subscribeToOrientationChange,
} from 'react-native-shine';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<string>();

  useEffect(() => {
    setOrientation(getAngleFromDimensions() === 0 ? 'PORTRAIT' : 'LANDSCAPE');
    const unsubscribe = subscribeToOrientationChange((angleDeg) => {
      setOrientation(angleDeg === 0 ? 'PORTRAIT' : 'LANDSCAPE');
    });

    return () => unsubscribe();
  }, []);

  return orientation;
};
