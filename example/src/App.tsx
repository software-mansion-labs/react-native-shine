import { View, StyleSheet, Text } from 'react-native';
import { Shine } from 'react-native-shine';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>nice</Text>
      <Shine />
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
