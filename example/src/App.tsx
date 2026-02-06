import { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import {
  addV2d,
  angleToV2d,
  multiplyV2d,
  Shine,
  ShineGroup,
  useOrientation,
  type V2d,
  zeroV2d,
} from 'react-native-shine';
import { watch_img } from './img';
import type { ColorMask } from '../../src/types/types';
import { HSVColorsPreset } from '../../src/enums/colorPresets';

export default function App() {
  const orientation = useOrientation();
  const lightPosition = useSharedValue<V2d>(zeroV2d);
  const rotation = useRef<number>(0);
  const nh = 0.4;
  const nw = nh;

  const [glareOptions /*setGlareOptions*/] = useState({
    glowPower: 1.7,
    glareIntensity: 0.6,
    lightIntensity: 0.7,
    glareColor: {
      hueBlendPower: 1.0,
      hueShiftAngleMin: -30,
      hueShiftAngleMax: 30,
    },
  });

  //bigger values make the channels less reflective
  //smaller values make the channels more reflective
  // const [detectionChannelState /*setDetectionChannelState*/] = useState({
  //   // redChannel: -0.2, //reflect more on red
  //   // greenChannel: 0.5, //reflect less on green
  //   // blueChannel: 1.0,
  //   redChannel: 1.5, //reflect more on red
  //   greenChannel: -1.0,
  //   blueChannel: -0.4,
  // });

  const [colorMaskOptions /*setColorMaskOptions*/] = useState<ColorMask[]>([
    // HSVColorsPreset.YELLOW,
    // HSVColorsPreset.ORANGE,
    HSVColorsPreset.CYAN,
    HSVColorsPreset.BLUE,
    HSVColorsPreset.TRUE_BLUE,
    HSVColorsPreset.ROYAL_BLUE,
    HSVColorsPreset.INDIGO,
    {
      hueMin: 180,
      hueMax: 290,
      saturationMin: 0.2,
      lightnessMin: 0.0,
    },
  ]);

  useFrameCallback(() => {
    lightPosition.value = addV2d(
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
        imageURI={watch_img}
        effects={[
          { name: 'glare', options: glareOptions },
          {
            name: 'glareFlareParabolic',
            options: {
              ringIntensity: 0.1,
              rayCount: 0.0,
              spotIntensity: 0.0,
              falloff: 1.0,
              flareIntensity: 0.3,
              rayIntensity: 1.0,
            },
          },
          // { name: 'doubleHolo' },
          // { name: 'reverseHolo', options: detectionChannelState },
        ]}
        lightPosition={lightPosition}
        highlightColors={colorMaskOptions}
        isHighlightInclusive={true}
        translateViewIn3d
      />
      <ShineGroup
        translateViewIn3d={{}}
        effects={[{ name: 'glare', options: glareOptions }]}
        lightPosition={lightPosition}
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
