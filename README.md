# react-native-shine

Fast and efficient way to add interactive GPU-based shader effects to your React Native apps using [TypeGPU](https://github.com/software-mansion/TypeGPU) and [WebGPU](https://github.com/wcandillon/react-native-webgpu).

`react-native-shine` leverages powerful GPU execution via native bindings, delivering lovely, fancy and **shiny** effects—ideal for UIs or creative interactions.

---

## ⚙️ Installation

Install the library:

```sh
yarn add react-native-shine
# or
npm install react-native-shine
```

---

### 📦 Install Required Peer Dependencies

This library depends on several native modules that must be installed in your host app.

Install required peer dependencies with:

```sh
yarn add react-native-reanimated react-native-worklets react-native-wgpu typegpu
# or
npm install react-native-reanimated react-native-worklets react-native-wgpu typegpu
```

These are not bundled with the library and must match compatible versions used by your app.

---

### 🛠️ Optional: Auto-install Peer Dependencies

You can also use our helper script to install all peer deps automatically:

```sh
yarn run install-peers
```

Or use `install-peerdeps`:

```sh
npx install-peerdeps react-native-shine
```

> Note: `install-peerdeps` reads the `peerDependencies` section of the package and installs them at the root level of your project.

---

### Update Your `babel.config.js`

For this library to work, you need to add the `unplugin-typegpu/babel` plugin. It comes bundled as a dependency, so you just need to add it in your Babel config.

```js
plugins: ['unplugin-typegpu/babel'];
```

For additional instructions, please follow the [TypeGPU Unplugin docs](https://docs.swmansion.com/TypeGPU/tooling/unplugin-typegpu/).

---

## 📋 Requirements

- React Native ≥ 0.71
- `react-native-reanimated` ≥ 4.0.0
- `react-native-webgpu` ≥ 0.2.0
- WebGPU-compatible device/emulator

> [!NOTE]
> If you’re using Expo, you’ll need to use the bare workflow (custom dev client or prebuild) to support native modules.

---

## 🚀 Usage

Basic example:

```tsx
import { View } from 'react-native';
import { Shine } from 'react-native-shine';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Shine
        imageURI="https://assets.pkmn.gg/fit-in/600x836/filters:format(webp)/images/cards/dp7/dp7-101.png?signature=1354344def4514e05080d064310884cdd6a27ef93692d9656eda9ae84ae1b2e1"
        width={300}
        height={400}
      />
    </View>
  );
}
```

Coming soon: docs and examples.

---

## 🧪 Troubleshooting

If you encounter runtime or build issues:

- Make sure all peer dependencies are installed.
- Rebuild your app after installing native modules:

  ```sh
  # iOS
  cd ios && xcodebuild clean && cd ..
  npx react-native run-ios

  # Android
  cd android && ./gradlew clean && cd ..
  npx react-native run-android
  ```

  ```sh
  # Expo

  # iOS
  npx expo prebuild
  npx expo run:ios

  # Android
  npx expo prebuild
  npx expo run:android
  ```

- Clear bundler cache (helps with Metro native linking issues).

---

## 🧑‍💻 Contributing

Want to help improve `react-native-shine`?

Check out the [`CONTRIBUTING.md`](CONTRIBUTING.md) guide for instructions on how to build, test, and submit PRs.

We welcome shaders, GPU visual effects, demos, and bug fixes!

---

## 📜 License

MIT © [VoidFrog](https://github.com/VoidFrog)

---

Made with ❤️ and [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
