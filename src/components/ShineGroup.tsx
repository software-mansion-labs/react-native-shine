import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  type LayoutChangeEvent,
  PixelRatio,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import type { V2d } from '../types/vector';
import { sizeFromV2d, sizeToV2d } from '../utils/size';
import { areV2dEqual, multiplyV2d, round2D } from '../utils/vector';
import { Shine, type ShineProps } from './Shine';

type ShineGroupProps = PropsWithChildren<Partial<ShineProps>>;

export function ShineGroup({
  children,
  glareOptions,
  highlightColors: colorMaskOptions,
  maskURI,
  lightPosition: touchPosition,
  addHolo = false,
  addReverseHolo = false,
}: ShineGroupProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [capturedURI, setCapturedURI] = useState<string | null>(null);
  const [size, setSize] = useState<V2d | null>(null);

  const onInnerLayout = (e: LayoutChangeEvent) => {
    const layoutV2d = sizeToV2d(e.nativeEvent.layout);

    if (!size || !areV2dEqual(size, layoutV2d)) {
      setSize(layoutV2d);
    }
  };

  // When we have a valid measured size, take a snapshot (after a short tick)
  // Short timeout helps when children include images that finish layout a few ms later
  useEffect(() => {
    if (!viewShotRef.current || !size) return;

    let mounted = true;
    const t = setTimeout(async () => {
      try {
        const pixel = round2D(multiplyV2d(size, PixelRatio.get()));

        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1,
          ...sizeFromV2d(pixel),
        });
        if (mounted) setCapturedURI(uri);
      } catch (err) {
        console.warn('ShineGroup capture failed', err);
      }
    }, 50);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [size, children]);

  return (
    <View style={styles.container}>
      {!capturedURI && (
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View onLayout={onInnerLayout} style={styles.inner}>
            {children}
          </View>
        </ViewShot>
      )}

      {capturedURI && size && (
        <Shine
          {...sizeFromV2d(size)}
          imageURI={capturedURI}
          glareOptions={glareOptions}
          highlightColors={colorMaskOptions}
          maskURI={maskURI}
          lightPosition={touchPosition}
          addReverseHolo={addReverseHolo}
          addHolo={addHolo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { display: 'flex', flexDirection: 'column', gap: 10 },
  inner: {},
});
