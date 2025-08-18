import type { TgpuRenderPipeline, TgpuRoot, TgpuTexture } from 'typegpu';
import type { BindGroupPair } from '../types/types';
import { maskTextureBindGroupLayout } from './bindGroupLayouts';
import { createBindGroupPairs } from '../types/typeUtils';
import mainVertex from './vertexShaders/mainVertex';
import maskFragment from './fragmentShaders/maskFragment';

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

export const createMaskPipeline = (
  root: TgpuRoot,
  texture: TgpuTexture | null,
  sampler: GPUSampler,
  presentationFormat: GPUTextureFormat
): TgpuRenderPipeline | null => {
  if (!texture) return null;

  const maskTextureBindGroup = root.createBindGroup(
    maskTextureBindGroupLayout,
    {
      texture: root.unwrap(texture).createView(),
      sampler,
    }
  );
  const maskBGP: BindGroupPair[] = createBindGroupPairs(
    [maskTextureBindGroupLayout],
    [maskTextureBindGroup]
  );

  let maskPipeline = root['~unstable']
    .withVertex(mainVertex, {})
    .withFragment(maskFragment, getDefaultTarget(presentationFormat))
    .createPipeline();
  maskPipeline = attachBindGroups(maskPipeline, maskBGP);

  return maskPipeline;
};
