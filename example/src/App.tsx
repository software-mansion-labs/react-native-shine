import { View, StyleSheet, Text } from 'react-native';
import { Shine } from 'react-native-shine';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>nice</Text>
      <Shine
        width={200}
        height={267}
        imageURI={
          'https://assets.pkmn.gg/fit-in/600x836/filters:format(webp)/images/cards/sm115/sm115-007.png?signature=d614178b139f5ebebe4d0009310f1b76678b6d3924c7218e28bf61d139097482'
        }
      />
      <Shine
        width={300}
        height={400}
        imageURI={
          'https://assets.pkmn.gg/fit-in/600x836/filters:format(webp)/images/cards/sm115/sm115-007.png?signature=d614178b139f5ebebe4d0009310f1b76678b6d3924c7218e28bf61d139097482'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
