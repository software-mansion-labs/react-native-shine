import tgpu from 'typegpu';
import * as d from 'typegpu/data';

export const textureBindGroupLayout = tgpu.bindGroupLayout({
  texture: { texture: 'float', dimension: '2d', sampleType: 'float' },
  sampler: { sampler: 'filtering' },
});

export const rotationValuesBindGroupLayout = tgpu.bindGroupLayout({
  vec: { uniform: d.vec3f },
});

export const bloomOptionsSchema = d.struct({
  glowPower: d.f32,
  hueShiftAngleMax: d.f32,
  hueShiftAngleMin: d.f32,
  hueBlendPower: d.f32,
  lightIntensity: d.f32,
  bloomIntensity: d.f32,
});

export type bloomOptionsSchema = typeof bloomOptionsSchema;

export const bloomOptionsBindGroupLayout = tgpu.bindGroupLayout({
  bloomOptions: { uniform: bloomOptionsSchema },
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
