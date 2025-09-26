import { useCallback, useEffect, useRef } from 'react';

export default function useAnimationFrame(cb: () => void) {
  const requestId = useRef<number>(null);

  const onFrame = useCallback(
    function () {
      cb();
      requestId.current = requestAnimationFrame(onFrame);
    },
    [cb]
  );

  useEffect(() => {
    requestId.current = requestAnimationFrame(onFrame);

    return () => {
      requestId.current === null || cancelAnimationFrame(requestId.current);
    };
  }, [onFrame]);
}
