import tgpu, { type ValidateBufferSchema } from 'typegpu';
import * as d from 'typegpu/data';
import type { BufferUsageType } from './resourceManagement/bufferManager';

export const textureBindGroupLayout = tgpu.bindGroupLayout({
  texture: { texture: 'float', dimension: '2d', sampleType: 'float' },
  sampler: { sampler: 'filtering' },
});

export const maskTextureBindGroupLayout = tgpu.bindGroupLayout({
  texture: { texture: 'float', dimension: '2d', sampleType: 'float' },
  sampler: { sampler: 'filtering' },
});

export const rotationValuesBindGroupLayout = tgpu.bindGroupLayout({
  vec: { uniform: d.vec3f },
});

export const glareOptionsSchema = d.struct({
  glowPower: d.f32,
  hueShiftAngleMax: d.f32,
  hueShiftAngleMin: d.f32,
  hueBlendPower: d.f32,
  lightIntensity: d.f32,
  glareIntensity: d.f32,
});

export type glareOptionsSchema = typeof glareOptionsSchema;

export const glareOptionsBindGroupLayout = tgpu.bindGroupLayout({
  glareOptions: { uniform: glareOptionsSchema },
});

export const colorMaskSchema = d.struct({
  baseColor: d.vec3f,
  rgbToleranceRange: d.struct({
    upper: d.vec3f,
    lower: d.vec3f,
  }),
});

export type colorMaskSchema = typeof colorMaskSchema;

export const colorMaskBindGroupLayout = tgpu.bindGroupLayout({
  mask: { uniform: colorMaskSchema },
});

export const bufferData = {
  rotationBuffer: {
    schema: d.vec3f,
    usage: 'uniform',
  },
  glareBuffer: {
    schema: glareOptionsSchema,
    usage: 'uniform',
  },
  colorMaskBuffer: {
    schema: colorMaskSchema,
    usage: 'uniform',
  },
} as const satisfies Record<
  string,
  { schema: ValidateBufferSchema<any>; usage: BufferUsageType }
>;

export type BufferDataMap = typeof bufferData;

// export const holoSchema = d.struct({
//   intensity: d.f32,
//   waveCallback: WaveCallback, //TgpuFn<(uv: d.Vec2f) => d.Vec2f>,
// });

// export type holoSchema = typeof holoSchema;

// export const holoBindGroupLayout = tgpu.bindGroupLayout({
//   holoOptions: { uniform: holoSchema },
// });
