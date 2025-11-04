import { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import {
  addV2d,
  angleToV2d,
  ColorPresets,
  multiplyV2d,
  Shine,
  ShineGroup,
  useOrientation,
  type V2d,
  zeroV2d,
} from 'react-native-shine';
import { tree_img } from './img';
import type { ColorMask, DeepPartiallyOptional } from '../../src/types/types';

export default function App() {
  const orientation = useOrientation();
  const touchPosition = useSharedValue<V2d>(zeroV2d);
  const rotation = useRef<number>(0);
  const nh = 0.4;
  const nw = nh;

  const [glareOptions /*setGlareOptions*/] = useState({
    glowPower: 0.7,
    glareIntensity: 0.6,
    lightIntensity: 0.7,
    hueBlendPower: 1.0,
    hueShiftAngleMin: -Math.PI,
    hueShiftAngleMax: Math.PI,
  });

  //bigger values make the channels less reflective
  //smaller values make the channels more reflective
  const [detectionChannelState /*setDetectionChannelState*/] = useState({
    redChannel: 1.3, //reflect less on red
    greenChannel: -0.2, //reflect more on green
    blueChannel: -1.0,
  });

  const [colorMaskOptions /*setColorMaskOptions*/] = useState<
    DeepPartiallyOptional<ColorMask, 'baseColor'>
  >({
    baseColor: ColorPresets.POTATO, //[80, 60, 30],
    useHSV: true,
    hueToleranceRange: { upper: 20, lower: 20 },
    lowBrightnessThreshold: 0.1,
    lowSaturationThreshold: 0.1,
  });

  useFrameCallback(() => {
    touchPosition.value = addV2d(
      zeroV2d,
      multiplyV2d(angleToV2d((rotation.current += 0.025)), 0.5)
    );
  });

  return (
    <View
      style={[
        orientation === 'PORTRAIT' ? styles.containerCol : styles.containerRow,
        styles.containerColor,
        { backgroundColor: '#0a2e3bff' },
      ]}
    >
      <Shine
        width={734 * nw}
        height={1024 * nh}
        imageURI={tree_img}
        maskURI={tree_img}
        // addHolo={true}
        addReverseHolo={true}
        reverseHoloDetectionChannelOptions={detectionChannelState}
        // glareOptions={glareOptions}
        touchPosition={touchPosition}
        translateViewIn3d
        colorMaskOptions={colorMaskOptions}
      />
      <ShineGroup
        glareOptions={glareOptions}
        // addHolo={true}
        touchPosition={touchPosition}
      >
        <View style={{ backgroundColor: 'blue' }}>
          <View>
            <Text>some example text inside the inner View</Text>
          </View>
          <Text>some example text outside the inner View</Text>
        </View>
      </ShineGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  containerCol: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerRow: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerColor: {
    // backgroundColor: '#ae78aeff',
    // backgroundColor: '#2c2c2c',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 30,
  },
});
