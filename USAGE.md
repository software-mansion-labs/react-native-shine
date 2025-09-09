# React Native Shine Component

The `Shine` component from `react-native-shine` provides animated and interactive visual effects for images using `WebGPU` with `TypeGPU` in `React Native`. It supports effects such as glare, color masking, and holographic overlays, and can react to device motion, passed position and user touch input (coming soon).

---

## Parameters

### Basic Properties

- **`width`** `number`: The width of the drawing canvas in pixels.
- **`height`** `number`: The height of the canvas in pixels.
- **`imageURI`** `string`: The URI of the primary image to be rendered.
- **`maskURI`** `string` (optional): URI of an optional mask texture used in masking effects.

---

### Glare Options

- **. `glareOptions`** `GlareOptions` (optional): Used to configure lighting and glare behavior.
  - **`glowPower`** `number`: Intensity of the ambient glow behind the light.
  - **`glareIntensity`** `number`: Intensity of the glare effect.
  - **`lightIntensity`** `number`: Overall brightness contribution from the light source.
  - **`hueBlendPower`** `number`: Controls strength of hue-based blending.
  - **`hueShiftAngleMin`** `number`: Minimum hue shift angle for the glare gradient.
  - **`hueShiftAngleMax`** `number`: Maximum hue shift angle for the glare gradient.

---

### Color Mask Options

```ts
type vec3 = [number, number, number];
```

- **`colorMaskOptions`** `ColorMask` (optional): Controls color-based masking for highlighting or filtering.
  - **`baseColor`** `vec3`: Target RGB color for masking.
  - **`rgbToleranceRange`** `{ upper?: vec3, lower?: vec3 }` : Upper and lower bounds for RGB tolerance.

Example:

```ts
colorMaskOptions = {
  baseColor: [255, 255, 255],
  rgbToleranceRange: {
    upper: [20, 20, 20],
    lower: [10, 10, 10],
  },
};
```

---

### Feature Toggles

These props enable optional graphical features:

- **`addTextureMask`** `boolean` (optional): Uses the `maskURI` as a texture mask overlay.
- **`addReverseHolo`** `boolean` (optional): Enables a reversed holographic shimmer effect.
- **`addHolo`** `boolean` (optional): Enables a rainbow-like holographic overlay effect.

---

### Touch Control Options

Used to control the effects based on user input rather than gravity vector:

- **`useTouchControl`** `boolean` (optional): Enables manual control using touch coordinates.
- **`touchPosition`** `SharedValue<[number, number]>` (optional): Provides external touch-based position for light rotation control.

---

## Additive Visual Effect Comparison

#### No effects

<img src="/example/assets/dedenne_pokemon.png" alt="img_glare" width="300"/>

#### +Glare

<img src="/example/assets/glare_ex.png" alt="img_glare" width="300"/>

#### +Texture Mask

<img src="/example/assets/texture_mask_ex.png" alt="img_glare" width="300"/>

#### +Reverse holo

<img src="/example/assets/reverse_holo_ex.png" alt="img_glare" width="300"/>

#### +Holo

<img src="/example/assets/holo_ex.png" alt="img_glare" width="300"/>

#### +Color Mask

<img src="/example/assets/color_mask_ex.png" alt="img_glare" width="300"/>

## Usage Example

```tsx
import { View } from 'react-native';
import { Shine } from 'react-native-shine';
import { useSharedValue } from 'react-native-reanimated';

export default function App() {
  const touchPosition = useSharedValue<[number, number]>([0.0, 0.0]);

  return (
    <View>
      <Shine
        width={300}
        height={400}
        imageURI="https://example.com/card_image.png"
        maskURI="https://example.com/mask_image.png"
        addTextureMask={true}
        useTouchControl={true}
        touchPosition={touchPosition}
        glareOptions={{
          glowPower: 1.0,
          glareIntensity: 0.6,
        }}
        colorMaskOptions={{
          baseColor: [200, 110, 70],
          rgbToleranceRange: { upper: [75, 80, 80] },
        }}
      />
    </View>
  );
}
```

---

## Orientation Utilities

The library exports utility functions for responding to device orientation changes:

**`useOrientation`** `string`: returns a state with value of `PORTRAIT` or `LANDSCAPE` based on current position.

---
