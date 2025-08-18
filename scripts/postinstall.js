console.warn('\n🔆 react-native-shine installed!\n');
console.warn(
  '⚠️  Make sure you have the following peer dependencies installed:\n'
);
console.warn('• react-native-reanimated');
console.warn('• react-native-worklets');
console.warn('• react-native-wgpu');
console.warn('• typegpu');

console.warn('\n👉 You can install them with:\n');
console.warn(
  '\tyarn add react-native-reanimated react-native-worklets react-native-wgpu typegpu \nor\n\tnpm install react-native-reanimated react-native-worklets react-native-wgpu typegpu'
);

process.stderr.write('\n✅ postinstall finished.\n');
console.log(
  '👉 For more details, visit: https://github.com/wojtus7/react-native-shine'
);
