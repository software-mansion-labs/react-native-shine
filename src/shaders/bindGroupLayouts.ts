import tgpu from 'typegpu';
import { vec3f } from 'typegpu/data';

export const textureBindGroupLayout = tgpu.bindGroupLayout({
  texture: { texture: 'float', dimension: '2d', sampleType: 'float' },
  sampler: { sampler: 'filtering' },
});

export const rotationValuesBindGroupLayout = tgpu.bindGroupLayout({
  vec: { uniform: vec3f },
});
