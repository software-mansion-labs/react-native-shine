import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import {
  getAngleFromDimensions,
  Shine,
  subscribeToOrientationChange,
} from 'react-native-shine';
import { pokemon, wildCharge, wildChargeMask } from './img';
import { useSharedValue } from 'react-native-reanimated';

export default function App() {
  const [orientation, setOrientation] = useState<string>();
  const touchPosition = useSharedValue<[number, number]>([0.0, 0.0]);
  const rotation = useRef<number>(0);

  const moveInCircle = () => {
    const radius = 0.5;
    const [centerX, centerY] = [0, 0];
    const angle = rotation.current;

    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    touchPosition.value = [x, y];

    rotation.current += 0.05;
  };
  //TODO: add a function that gets the stateSetter and updates the value accordingly
  //      so that the user doesn't have to write such basic logic
  useEffect(() => {
    setOrientation(getAngleFromDimensions() === 0 ? 'PORTRAIT' : 'LANDSCAPE');
    const unsubscribe = subscribeToOrientationChange((angleDeg) => {
      setOrientation(angleDeg === 0 ? 'PORTRAIT' : 'LANDSCAPE');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      moveInCircle();
      console.log(touchPosition.value);
    }, 50);
    return () => {
      clearInterval(id);
    };
  });

  return (
    <View
      style={[
        orientation === 'PORTRAIT' ? styles.containerCol : styles.containerRow,
        styles.containerColor,
      ]}
    >
      <Shine
        width={200}
        height={267}
        imageURI={
          pokemon
          // charmander
          // 'https://assets.pkmn.gg/fit-in/600x836/filters:format(webp)/images/cards/sm115/sm115-007.png?signature=d614178b139f5ebebe4d0009310f1b76678b6d3924c7218e28bf61d139097482'
        }
        glareOptions={{ glowPower: 1 }}
      />
      <Shine
        width={300}
        height={400}
        imageURI={
          // 'https://assets.pkmn.gg/fit-in/600x836/filters:format(webp)/images/cards/sm115/sm115-007.png?signature=d614178b139f5ebebe4d0009310f1b76678b6d3924c7218e28bf61d139097482'
          wildCharge
        }
        glareOptions={{
          glowPower: 0.6,
          glareIntensity: 0.6,
          lightIntensity: 0.8,
          hueBlendPower: 0.6,
          hueShiftAngleMin: -10,
          hueShiftAngleMax: -1.5,
        }}
        colorMaskOptions={{
          baseColor: [0, 0, 0],
          // rgbToleranceRange: { upper: [70, 80, 80] },
        }}
        maskURI={wildChargeMask}
        useTouchControl={true}
        touchPosition={touchPosition}
      />
      <Text style={styles.text}>nice</Text>
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
    backgroundColor: '#ae78aeff',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 30,
  },
});
