import type { vec3 } from '../types/types';

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
