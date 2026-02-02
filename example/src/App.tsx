import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  addV2d,
  angleToV2d,
  multiplyV2d,
  Shine,
  ShineGroup,
  type ShineProps,
  useOrientation,
  type V2d,
  zeroV2d,
} from 'react-native-shine';
import {
  background_source,
  card1_img,
  card2_img,
  card3_img,
  tree_img,
  back_img,
} from './img';
import { HSVColorsPreset } from '../../src/enums/colorPresets';

const nh = 0.45;
const nw = nh;

export default function App() {
  const orientation = useOrientation();
  const lightPosition = useSharedValue<V2d>(zeroV2d);
  const rotation = useRef<number>(0);

  const [glareOptions] = useState({
    glowPower: 0.8,
    glareIntensity: 0.6,
    lightIntensity: 0.7,
    glareColor: {
      hueBlendPower: 1.0,
      hueShiftAngleMin: -30,
      hueShiftAngleMax: 30,
    },
  });

  const [detectionChannelState] = useState({
    redChannel: 1.5,
    greenChannel: -1.0,
    blueChannel: -0.4,
  });

  useFrameCallback(() => {
    lightPosition.value = addV2d(
      zeroV2d,
      multiplyV2d(angleToV2d((rotation.current += 0.025)), 0.5)
    );
  });

  return (
    <ImageBackground
      style={[
        orientation === 'PORTRAIT' ? styles.containerCol : styles.containerRow,
        styles.containerColor,
      ]}
      source={background_source}
      resizeMode="stretch"
    >
      <ScrollView horizontal pagingEnabled>
        <Card
          shineProps={{
            width: 734 * nw,
            height: 1024 * nh,
            imageURI: card1_img,
            effects: [
              { name: 'glare', options: glareOptions },
              {
                name: 'glareFlare',
                options: { ringIntensity: 0, rayCount: 2 },
              },
              { name: 'doubleHolo', options: { rotationShiftPower: 0.1 } },
              { name: 'reverseHolo', options: detectionChannelState },
            ],
            highlightColors: [
              HSVColorsPreset.GOLD,
              {
                hueMin: 165,
                hueMax: 255,
                lightnessMax: 0.8,
                saturationMin: 0.4,
              },
              HSVColorsPreset.WHITE,
              HSVColorsPreset.GOLD,
              HSVColorsPreset.AMBER,
            ],
            translateViewIn3d: true,
          }}
        />
        <Card
          shineProps={{
            width: 734 * nw,
            height: 1024 * nh,
            imageURI: card2_img,
            effects: [
              { name: 'glare', options: glareOptions },
              {
                name: 'glareFlare',
                options: { ringIntensity: 0, rayCount: 2 },
              },
              { name: 'doubleHolo', options: { rotationShiftPower: 0.3 } },
            ],
            highlightColors: [HSVColorsPreset.BEIGE],
            translateViewIn3d: true,
          }}
        />
        <Card
          shineProps={{
            width: 734 * nw,
            height: 1024 * nh,
            imageURI: card3_img,
            effects: [
              {
                name: 'glareFlare',
                options: {
                  ringIntensity: 0,
                  rayCount: 3,
                  flareIntensity: 1,
                  spotIntensity: 0.5,
                },
              },
              {
                name: 'reverseHolo',
                options: { ...detectionChannelState, glareIntensity: 0.3 },
              },
              { name: 'doubleHolo', options: { rotationShiftPower: 0.1 } },
            ],
            highlightColors: [HSVColorsPreset.BLUE],
            translateViewIn3d: true,
          }}
        />
      </ScrollView>
    </ImageBackground>
  );
}

const Card = ({ shineProps }: { shineProps?: ShineProps }) => {
  const rotation = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ perspective: 400 }, { rotateY: `${rotation.value}deg` }],
    };
  });

  const cardElevation = useAnimatedStyle(() => {
    return {
      zIndex: rotation.value > 90 ? 3 : 1,
    };
  });

  const rotateCard = () => {
    rotation.value = withTiming(rotation.value === 0 ? 180 : 0);
  };

  return (
    <TouchableOpacity onPress={rotateCard} activeOpacity={0.9}>
      <Animated.View
        style={[
          {
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
          },
          styles.cardWrapper,
          style,
        ]}
      >
        <Animated.View
          style={[{ position: 'absolute', zIndex: 3 }, cardElevation]}
        >
          <Shine
            style={styles.shineImage}
            width={734 * nw}
            height={1024 * nh}
            imageURI={back_img}

            translateViewIn3d
          />
        </Animated.View>
        <Animated.View style={{ position: 'absolute', zIndex: 2 }}>
          <Shine
            style={styles.shineImage}
            width={300}
            height={400}
            imageURI={tree_img}
            translateViewIn3d
            {...shineProps}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

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
  shineImage: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
