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

export default function App() {
  const orientation = useOrientation();
  const touchPosition = useSharedValue<V2d>(zeroV2d);
  const rotation = useRef<number>(0);
  const nh = 0.4;
  const nw = nh;

  const [glareOptions /*setGlareOptions*/] = useState({
    glowPower: 0.9,
    glareIntensity: 0.6,
    lightIntensity: 0.9,
    hueBlendPower: 0.3,
    hueShiftAngleMin: -10,
    hueShiftAngleMax: -1.5,
  });

  useFrameCallback(() => {
    touchPosition.value = addV2d(
      zeroV2d,
      multiplyV2d(angleToV2d((rotation.current += 0.01)), 0.5)
    );
  });

  return (
    <View
      style={[
        orientation === 'PORTRAIT' ? styles.containerCol : styles.containerRow,
        styles.containerColor,
      ]}
    >
      {/* <Shine
        width={734 * nw}
        height={1024 * nh}
        imageURI={
          // 'imgsrc'
        }
        colorMaskOptions={{
          baseColor: [0, 0, 0],
          // baseColor: [200, 110, 70],
          rgbToleranceRange: { upper: [75, 80, 80] },
        }}
        addHolo={true} //change how holo effect works (not really a holo rn, should be global for the card too)
        addReverseHolo={true}
        addTextureMask={true}
        glareOptions={glareOptions}
        useTouchControl={true}
        touchPosition={touchPosition}
      /> */}
      <ShineGroup
        glareOptions={glareOptions}
        // addHolo={true}
        useTouchControl={true}
        touchPosition={touchPosition}
      >
        <View style={{ backgroundColor: 'red' }}>
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
