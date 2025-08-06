import tgpu from 'typegpu';

export const textureBindGroupLayout = tgpu.bindGroupLayout({
  texture: { texture: 'float', dimension: '2d', sampleType: 'float' },
  sampler: { sampler: 'filtering' },
});
