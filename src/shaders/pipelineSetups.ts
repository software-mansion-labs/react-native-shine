import type {
  TgpuBindGroup,
  TgpuComputePipeline,
  TgpuRenderPipeline,
  TgpuRoot,
  TgpuTexture,
} from 'typegpu';
import { maskTextureBindGroupLayout } from './bindGroupLayouts';
import mainVertex from './vertexShaders/mainVertex';
import maskFragment from './fragmentShaders/maskFragment';
import { blend } from '../enums/effectPresets';

export function attachBindGroups(
  pipeline: TgpuRenderPipeline,
  bindGroups: TgpuBindGroup[]
): TgpuRenderPipeline;

export function attachBindGroups(
  pipeline: TgpuComputePipeline,
  bindGroups: TgpuBindGroup[]
): TgpuComputePipeline;

export function attachBindGroups(
  pipeline: TgpuRenderPipeline | TgpuComputePipeline,
  bindGroups: TgpuBindGroup[]
) {
  return bindGroups.reduce((acc, bindGroup) => acc.with(bindGroup), pipeline);
}

export const getDefaultTarget = (
  presentationFormat: GPUTextureFormat,
  blendMode?: GPUBlendState
): GPUColorTargetState => {
  return {
    format: presentationFormat,
    blend: blendMode,
  };
};

export const createMaskPipeline = (
  root: TgpuRoot,
  maskTexture: TgpuTexture | undefined,
  bindGroups: TgpuBindGroup[],
  sampler: GPUSampler, //TODO: change GPUSampler to TgpuFixedSampler when this type gets exposed
  presentationFormat: GPUTextureFormat
): TgpuRenderPipeline | void => {
  if (!maskTexture) return;

  const maskTextureBindGroup = root.createBindGroup(
    maskTextureBindGroupLayout,
    {
      texture: root.unwrap(maskTexture).createView(),
      sampler,
    }
  );
  const maskBGP: TgpuBindGroup[] = [maskTextureBindGroup];
  for (let i = 0; i < bindGroups.length; i++) {
    maskBGP.push(bindGroups[i]!);
  }
  let maskPipeline = root['~unstable']
    .withVertex(mainVertex, {})
    .withFragment(maskFragment, getDefaultTarget(presentationFormat, blend))
    .createPipeline();
  maskPipeline = attachBindGroups(maskPipeline, maskBGP);

  return maskPipeline;
};
