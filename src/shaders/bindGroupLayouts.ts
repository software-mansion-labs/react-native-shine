import tgpu, { type ValidateBufferSchema } from 'typegpu';
import * as d from 'typegpu/data';
import type { BufferUsageType } from './resourceManagement/bufferManager';

export const textureBindGroupLayout = tgpu.bindGroupLayout({
  // texture: { texture: d.texture2d(d.f32) } //TODO: revert this change after bumping typegpu version (currently there is a bug with texture formats)
  texture: { texture: 'float', dimension: '2d', sampleType: 'float' },
  sampler: { sampler: 'filtering' },
});

export const maskTextureBindGroupLayout = tgpu.bindGroupLayout({
  // texture: { texture: d.texture2d(d.f32) }, //TODO: same as above
  texture: { texture: 'float', dimension: '2d', sampleType: 'float' },
  sampler: { sampler: 'filtering' },
});

export const rotationBindGroupLayout = tgpu.bindGroupLayout({
  vec: { uniform: d.vec3f },
});

export const glareSchema = d.struct({
  glowPower: d.f32,
  hueShiftAngleMax: d.f32,
  hueShiftAngleMin: d.f32,
  hueBlendPower: d.f32,
  lightIntensity: d.f32,
  glareIntensity: d.f32,
});

export type GlareSchema = typeof glareSchema;

export const glareBindGroupLayout = tgpu.bindGroupLayout({
  glareOptions: { uniform: glareSchema },
});

export const colorMaskSchema = d.struct({
  baseColor: d.vec3f,
  rgbToleranceRange: d.struct({
    upper: d.vec3f,
    lower: d.vec3f,
  }),
  hueToleranceRange: d.struct({
    upper: d.f32,
    lower: d.f32,
  }),
  useHSV: d.align(16, d.u32),
  brightnessTolerance: d.f32,
  saturationTolerance: d.f32,
  lowSaturationThreshold: d.f32,
  lowBrightnessThreshold: d.f32,
  debugMode: d.u32,
});

export type ColorMaskSchema = typeof colorMaskSchema;

export const colorMaskBindGroupLayout = tgpu.bindGroupLayout({
  mask: { uniform: colorMaskSchema },
});

export const reverseHoloDetectionChannelFlagsSchema = d.struct({
  redChannel: d.align(16, d.f32),
  greenChannel: d.f32,
  blueChannel: d.f32,
  hue: d.f32,
  saturation: d.f32,
  value: d.f32,
});

export type ReverseHoloDetectionChannelFlagsSchema =
  typeof reverseHoloDetectionChannelFlagsSchema;

export const reverseHoloDetectionChannelFlagsBindGroupLayout =
  tgpu.bindGroupLayout({
    channelFlags: { uniform: reverseHoloDetectionChannelFlagsSchema },
    glareOptions: { uniform: glareSchema },
  });

export const bufferData = {
  rotation: {
    schema: d.vec3f,
    usage: 'uniform',
  },
  glare: {
    schema: glareSchema,
    usage: 'uniform',
  },
  colorMask: {
    schema: colorMaskSchema,
    usage: 'uniform',
  },
  reverseHoloDetectionChannelFlags: {
    schema: reverseHoloDetectionChannelFlagsSchema,
    usage: 'uniform',
  },
} as const satisfies Record<
  string,
  { schema: ValidateBufferSchema<any>; usage: BufferUsageType }
>;

export type BufferData = typeof bufferData;

// export const holoSchema = d.struct({
//   intensity: d.f32,
//   waveCallback: WaveCallback, //TgpuFn<(uv: d.Vec2f) => d.Vec2f>,
// });

// export type holoSchema = typeof holoSchema;

// export const holoBindGroupLayout = tgpu.bindGroupLayout({
//   holoOptions: { uniform: holoSchema },
// });
