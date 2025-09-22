import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  type LayoutChangeEvent,
  Image,
  PixelRatio,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Shine, type ShineProps } from './Shine';

interface ShineGroupProps {
  children: React.ReactNode;
}

export function ShineGroup({
  children,
  glareOptions,
  colorMaskOptions,
  maskURI,
  touchPosition,
  useTouchControl = false,
  addTextureMask = false,
  addHolo = false,
  addReverseHolo = false,
}: ShineGroupProps & Partial<ShineProps>) {
  const viewShotRef = useRef<any>(null);
  const [capturedURI, setCapturedURI] = useState<string | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  const onInnerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (!size || size.width !== width || size.height !== height) {
        setSize({ width, height });
      }
    }
    console.log('onInnerLayout', width, height);
  };

  // When we have a valid measured size, take a snapshot (after a short tick)
  // Short timeout helps when children include images that finish layout a few ms later
  useEffect(() => {
    if (!viewShotRef.current || !size) return;

    let mounted = true;
    const t = setTimeout(async () => {
      try {
        const dpr = PixelRatio.get();
        const pixelW = Math.round(size.width * dpr);
        const pixelH = Math.round(size.height * dpr);

        const uri = await captureRef(viewShotRef.current, {
          format: 'png',
          quality: 1,
          width: pixelW,
          height: pixelH,
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
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View onLayout={onInnerLayout} style={styles.inner}>
          {children}
        </View>
      </ViewShot>

      {capturedURI && size && (
        <Image src={capturedURI} width={size.width} height={size.height} />
      )}

      {capturedURI && size && (
        <Shine
          width={size.width}
          height={size.height}
          imageURI={capturedURI}
          glareOptions={glareOptions}
          colorMaskOptions={colorMaskOptions}
          maskURI={maskURI}
          touchPosition={touchPosition}
          useTouchControl={useTouchControl}
          addTextureMask={addTextureMask}
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
