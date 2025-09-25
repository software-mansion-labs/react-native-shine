export interface V1d {
  x: number;
}

export interface V2d extends V1d {
  y: number;
}

export interface V3d extends V2d {
  z: number;
}

export type Transformer = (value: number) => number;
