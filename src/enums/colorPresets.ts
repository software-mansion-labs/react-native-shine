import type { ColorMask, vec3 } from '../types/types';

export const ColorPresets = {
  // --- Primary & Secondary ---
  RED: [255, 0, 0], // #FF0000
  GREEN: [0, 255, 0], // #00FF00
  BLUE: [0, 0, 255], // #0000FF
  YELLOW: [255, 255, 0], // #FFFF00
  CYAN: [0, 255, 255], // #00FFFF
  MAGENTA: [255, 0, 255], // #FF00FF

  // --- Grayscale ---
  WHITE: [255, 255, 255], // #FFFFFF
  BLACK: [0, 0, 0], // #000000
  GRAY: [128, 128, 128], // #808080
  LIGHT_GRAY: [211, 211, 211], // #D3D3D3
  DARK_GRAY: [105, 105, 105], // #696969

  // --- Common Colors ---
  ORANGE: [255, 165, 0], // #FFA500
  PURPLE: [128, 0, 128], // #800080
  BROWN: [165, 42, 42], // #A52A2A
  PINK: [255, 192, 203], // #FFC0CB
  LIME_GREEN: [50, 205, 50], // #32CD32
  FOREST_GREEN: [34, 139, 34], // #228B22
  OLIVE: [128, 128, 0], // #808000
  TEAL: [0, 128, 128], // #008080
  NAVY: [0, 0, 128], // #000080
  ROYAL_BLUE: [65, 105, 225], // #4169E1
  SKY_BLUE: [135, 206, 235], // #87CEEB
  INDIGO: [75, 0, 130], // #4B0082
  VIOLET: [238, 130, 238], // #EE82EE
  MAROON: [128, 0, 0], // #800000

  // --- Hues & Tints ---
  GOLD: [255, 215, 0], // #FFD700
  TOMATO: [255, 99, 71], // #FF6347
  SALMON: [250, 128, 114], // #FA8072
  BEIGE: [245, 245, 220], // #F5F5DC
  POTATO: [222, 184, 135], // #DEB887
} as const satisfies Record<string, vec3>;

export const HSVColorsPreset = {
  RED: { hueMin: 330, hueMax: 15 }, // #FF0022
  ORANGE: { hueMin: 15, hueMax: 45 }, // #FF8000
  YELLOW: { hueMin: 45, hueMax: 75 }, // #FFFF00
  GREEN: { hueMin: 75, hueMax: 165 }, // #00FF00
  BLUE: { hueMin: 165, hueMax: 255 }, // #0080FF
  VIOLET: { hueMin: 255, hueMax: 285 }, // #8000FF
  MAGENTA: { hueMin: 285, hueMax: 330 }, // #FF00D5

  TRUE_RED: { hueMin: 345, hueMax: 15 }, // #FF0000
  CRIMSON: { hueMin: 330, hueMax: 350 }, // #FF0055
  ROSE: { hueMin: 315, hueMax: 335 }, // #FF0095
  PINK: { hueMin: 300, hueMax: 330 }, // #FF00BF

  CORAL: { hueMin: 10, hueMax: 30 }, // #FF5500
  TRUE_ORANGE: { hueMin: 20, hueMax: 45 }, // #FF8C00
  AMBER: { hueMin: 35, hueMax: 50 }, // #FFB300
  TRUE_YELLOW: { hueMin: 45, hueMax: 65 }, // #FFD500
  GOLD: { hueMin: 40, hueMax: 55 }, // #FFCC00

  LIME: { hueMin: 65, hueMax: 90 }, // #BFFF00
  CHARTREUSE: { hueMin: 70, hueMax: 100 }, // #95FF00
  TRUE_GREEN: { hueMin: 90, hueMax: 140 }, // #15FF00
  EMERALD: { hueMin: 130, hueMax: 160 }, // #00FF6A
  MINT: { hueMin: 140, hueMax: 170 }, // #00FF95

  TEAL: { hueMin: 160, hueMax: 180 }, // #00FFD5
  CYAN: { hueMin: 170, hueMax: 195 }, // #00F2FF
  TURQUOISE: { hueMin: 165, hueMax: 190 }, // #00FFF2
  AZURE: { hueMin: 190, hueMax: 215 }, // #009FFF
  TRUE_BLUE: { hueMin: 210, hueMax: 240 }, // #0040FF
  ROYAL_BLUE: { hueMin: 225, hueMax: 250 }, // #0011FF
  INDIGO: { hueMin: 240, hueMax: 260 }, // #2B00FF

  TRUE_VIOLET: { hueMin: 250, hueMax: 280 }, // #6A00FF
  PURPLE: { hueMin: 260, hueMax: 290 }, // #9500FF
  TRUE_MAGENTA: { hueMin: 285, hueMax: 315 }, // #FF00FF
  FUCHSIA: { hueMin: 295, hueMax: 325 }, // #ff00d5ff

  GRAY: { hueMin: 0, hueMax: 360, saturationMax: 0.2, saturationMin: 0 }, // #738c8cff
  BEIGE: {
    hueMin: 330,
    hueMax: 300,
    saturationMin: 0,
    saturationMax: 0.3,
    lightnessMax: 0.95,
    lightnessMin: 0.4,
  },
  WHITE: {
    hueMin: 0,
    hueMax: 360,
    saturationMax: 1,
    saturationMin: 0,
    lightnessMax: 1,
    lightnessMin: 0.9,
  }, // #d9f2f2ff
  BLACK: {
    hueMin: 0,
    hueMax: 360,
    saturationMax: 1,
    saturationMin: 0,
    lightnessMax: 0.2,
    lightnessMin: 0,
  }, // #0d2626ff
} as const satisfies Record<string, ColorMask>;
