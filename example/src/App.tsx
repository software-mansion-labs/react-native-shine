import { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import {
  getAngleFromDimensions,
  Shine,
  subscribeToOrientationChange,
} from 'react-native-shine';
import { pokemon, pokemonCardMaskGrad } from './img';

export default function App() {
  const [orientation, setOrientation] = useState<string>();

  //TODO: add a function that gets the stateSetter and updates the value accordingly
  //      so that the user doesn't have to write such basic logic
  useEffect(() => {
    setOrientation(getAngleFromDimensions() === 0 ? 'PORTRAIT' : 'LANDSCAPE');
    const unsubscribe = subscribeToOrientationChange((angleDeg) => {
      setOrientation(angleDeg === 0 ? 'PORTRAIT' : 'LANDSCAPE');
    });

    return () => unsubscribe();
  }, []);

  return (
    <View
      style={[
        orientation === 'PORTRAIT' ? styles.containerCol : styles.containerRow,
        styles.containerColor,
      ]}
    >
      <Text>nice</Text>
      <Shine
        width={200}
        height={267}
        imageURI={
          pokemon
          // charmander
          // 'https://assets.pkmn.gg/fit-in/600x836/filters:format(webp)/images/cards/sm115/sm115-007.png?signature=d614178b139f5ebebe4d0009310f1b76678b6d3924c7218e28bf61d139097482'
        }
        bloomOptions={{ glowPower: 10 }}
        colorMaskOptions={{
          baseColor: [255, 200, 0],
          rgbToleranceRange: {},
        }}
      />
      <Shine
        width={300}
        height={400}
        imageURI={
          'https://assets.pkmn.gg/fit-in/600x836/filters:format(webp)/images/cards/sm115/sm115-007.png?signature=d614178b139f5ebebe4d0009310f1b76678b6d3924c7218e28bf61d139097482'
        }
        bloomOptions={{
          glowPower: 1,
          bloomIntensity: 1,
          lightIntensity: 1,
          hueBlendPower: 5,
          hueShiftAngleMax: 1,
          hueShiftAngleMin: 0,
        }}
        colorMaskOptions={{
          baseColor: [0, 0, 0],
          rgbToleranceRange: { upper: [70, 80, 80] },
        }}
        maskURI={pokemonCardMaskGrad}
      />
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
});
