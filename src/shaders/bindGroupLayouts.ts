import tgpu, { type ValidateBufferSchema } from 'typegpu';
import * as d from 'typegpu/data';
import type { BufferUsageType } from './resourceManagement/bufferManager';

export const rotationSchema = d.vec3f;

export const sharedBindGroupLayout = tgpu.bindGroupLayout({
  texture: { texture: d.texture2d(d.f32) },
  sampler: { sampler: 'filtering' },
  rot: { uniform: rotationSchema },
});

export const maskTextureBindGroupLayout = tgpu.bindGroupLayout({
  texture: { texture: d.texture2d(d.f32) },
  sampler: { sampler: 'filtering' },
});

export const glareSchema = d.struct({
  glareColor: d.struct({
    hueShiftAngleMax: d.f32,
    hueShiftAngleMin: d.f32,
    hueBlendPower: d.f32,
  }),
  glowPower: d.align(16, d.f32),
  lightIntensity: d.f32,
  glareIntensity: d.f32,
});

export type GlareSchema = typeof glareSchema;

export const glareBindGroupLayout = tgpu.bindGroupLayout({
  glareOptions: { uniform: glareSchema },
});

//TODO: change the buffer so it reserves memory for an array of colorMaskSchemas
export const colorMaskSchema = d.struct({
  baseColor: d.vec3f,
  rgbToleranceRange: d.struct({
    upper: d.vec3f,
    lower: d.vec3f,
  }),
  hueStart: d.f32,
  hueRange: d.f32,
  useHSV: d.align(16, d.u32),
  minLimits: d.vec2f,
  maxLimits: d.vec2f,
  debugMode: d.u32,
});

export type ColorMaskSchema = d.Infer<typeof colorMaskSchema>;

export const COLOR_MASK_MAX_COUNT = 8;

export const colorMaskArraySchema = d.struct({
  masks: d.arrayOf(colorMaskSchema, COLOR_MASK_MAX_COUNT),
  usedMaskCount: d.i32,
  reverseHighlight: d.i32,
});

export type ColorMaskArraySchema = typeof colorMaskArraySchema;

export const colorMaskBindGroupLayout = tgpu.bindGroupLayout({
  colorMasks: { uniform: colorMaskArraySchema },
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

export const holoSchema = d.struct({
  directionDegree: d.align(16, d.f32),
  shift: d.f32,
  rotationShiftPower: d.f32,
  holoSize: d.f32,
  holoMultiplier: d.f32,
  holoEaseSize: d.f32,
  holoVisibility: d.f32,
  holoSaturation: d.f32,
});

export type HoloSchema = typeof holoSchema;

export const holoBindGroupLayout = tgpu.bindGroupLayout({
  holoOptions: { uniform: holoSchema },
});

export const glareFlareSchema = d.struct({
  flareIntensity: d.f32,
  spotIntensity: d.f32,
  ringIntensity: d.f32,
  rayIntensity: d.f32,
  falloff: d.f32,
  rayCount: d.f32,
});

export type glareFlareSchema = typeof glareFlareSchema;

export const glareFlareBindGroupLayout = tgpu.bindGroupLayout({
  glareFlare: { uniform: glareFlareSchema },
});

export const precomputeColorMaskBindGroupLayout = tgpu.bindGroupLayout({
  colorMaskTextureDst: {
    storageTexture: d.textureStorage2d('rgba8unorm', 'read-write'),
  },
});

export type BufferSchemas =
  | d.Vec3f
  | ReverseHoloDetectionChannelFlagsSchema
  | ColorMaskArraySchema
  | GlareSchema;

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
    schema: colorMaskArraySchema,
    usage: 'uniform',
  },
  reverseHoloDetectionChannelFlags: {
    schema: reverseHoloDetectionChannelFlagsSchema,
    usage: 'uniform',
  },
} as const satisfies Record<
  string,
  { schema: ValidateBufferSchema<BufferSchemas>; usage: BufferUsageType }
>;

export type BufferData = typeof bufferData;
