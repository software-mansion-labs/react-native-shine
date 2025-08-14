const { execSync } = require('child_process');

const PEERS = [
  'react-native-reanimated',
  'react-native-worklets',
  'react-native-wgpu',
  'typegpu',
];

const installer = process.env.npm_config_user_agent?.includes('yarn')
  ? 'yarn add'
  : 'npm install';

console.log(`\n📦 Installing peer dependencies:\n${PEERS.join('\n')}\n`);

try {
  execSync(`${installer} ${PEERS.join(' ')}`, { stdio: 'inherit' });
  console.log('\n✅ Peer dependencies installed!\n');
} catch (err) {
  console.error('\n❌ Failed to install peer dependencies:', err.message);
}
