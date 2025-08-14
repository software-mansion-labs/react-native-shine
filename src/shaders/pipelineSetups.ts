import type { TgpuRenderPipeline } from 'typegpu';
import type { BindGroupPair } from '../types/types';

export const attachBindGroups = (
  pipeline: TgpuRenderPipeline,
  bindGroupPairs: BindGroupPair[]
) => {
  for (const pair of bindGroupPairs) {
    pipeline = pipeline.with(pair.layout, pair.group);
  }

  return pipeline;
};

export const getDefaultTarget = (
  presentationFormat: GPUTextureFormat
): GPUColorTargetState => {
  return {
    format: presentationFormat,
    blend: {
      color: {
        srcFactor: 'src-alpha',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add',
      },
      alpha: {
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add',
      },
    },
  };
};

export const attachBindGroupsToPass = (
  pass: any,
  bindGroupPairs: BindGroupPair[]
) => {
  for (const pair of bindGroupPairs) {
    pass.setBindGroup(pair.layout, pair.group);
  }

  return pass;
};
