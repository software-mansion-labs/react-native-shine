import type { TgpuRenderPipeline, TgpuRoot, TgpuTexture } from 'typegpu';
import type { BindGroupPair } from '../types/types';
import {
  maskTextureBindGroupLayout,
  textureBindGroupLayout,
} from './bindGroupLayouts';
import { createBindGroupPair, createBindGroupPairs } from '../types/typeUtils';
import mainVertex from './vertexShaders/mainVertex';
import maskFragment from './fragmentShaders/maskFragment';
import { reverseHoloFragment } from './fragmentShaders/reverseHoloFragment';
import { rainbowHoloFragment } from './fragmentShaders/rainbowHoloFragment';

export const attachBindGroups = (
  pipeline: TgpuRenderPipeline,
  bindGroupPairs: BindGroupPair[]
) => {
  for (const pair of bindGroupPairs) {
    pipeline = pipeline.with(pair.layout, pair.group);
  }

  return pipeline;
};

export const blend: GPUBlendState = {
  color: {
    srcFactor: 'one-minus-src-alpha',
    dstFactor: 'src-alpha',
    operation: 'add',
  } satisfies GPUBlendComponent,
  alpha: {
    srcFactor: 'one-minus-src-alpha',
    dstFactor: 'dst-alpha',
    operation: 'add',
  } satisfies GPUBlendComponent,
};

export const getDefaultTarget = (
  presentationFormat: GPUTextureFormat,
  blendMode?: GPUBlendState
): GPUColorTargetState => {
  return {
    format: presentationFormat,
    blend: blendMode,
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
  maskTexture: TgpuTexture | null,
  imageTextureBindGroupPair: BindGroupPair,
  sampler: GPUSampler,
  presentationFormat: GPUTextureFormat
): TgpuRenderPipeline | null => {
  if (!maskTexture) return null;

  const maskTextureBindGroup = root.createBindGroup(
    maskTextureBindGroupLayout,
    {
      texture: root.unwrap(maskTexture).createView(),
      sampler,
    }
  );
  const maskBGP: BindGroupPair[] = createBindGroupPairs(
    [maskTextureBindGroupLayout],
    [maskTextureBindGroup]
  );
  maskBGP.push(imageTextureBindGroupPair);

  let maskPipeline = root['~unstable']
    .withVertex(mainVertex, {})
    .withFragment(maskFragment, getDefaultTarget(presentationFormat, blend))
    .createPipeline();
  maskPipeline = attachBindGroups(maskPipeline, maskBGP);

  return maskPipeline;
};

export const createReverseHoloPipeline = (
  root: TgpuRoot,
  texture: TgpuTexture | null,
  BGP: BindGroupPair[],
  sampler: GPUSampler,
  presentationFormat: GPUTextureFormat
): TgpuRenderPipeline | null => {
  if (!texture) return null;

  const reverseHoloBindGroup = root.createBindGroup(
    maskTextureBindGroupLayout,
    {
      texture: root.unwrap(texture).createView(),
      sampler,
    }
  );
  const reverseHoloBGP: BindGroupPair[] = BGP;
  reverseHoloBGP.push(
    createBindGroupPair(maskTextureBindGroupLayout, reverseHoloBindGroup)
  );

  let reverseHoloPipeline = root['~unstable']
    .withVertex(mainVertex, {})
    .withFragment(
      reverseHoloFragment,
      getDefaultTarget(presentationFormat, blend)
    )
    .createPipeline();
  reverseHoloPipeline = attachBindGroups(reverseHoloPipeline, reverseHoloBGP);

  return reverseHoloPipeline;
};

export const createRainbowHoloPipeline = (
  root: TgpuRoot,
  texture: TgpuTexture | null,
  BGP: BindGroupPair[],
  sampler: GPUSampler,
  presentationFormat: GPUTextureFormat
): TgpuRenderPipeline | null => {
  if (!texture) return null;

  const imageTextureBindGroup = root.createBindGroup(textureBindGroupLayout, {
    texture: root.unwrap(texture).createView(),
    sampler,
  });

  const texBGP = createBindGroupPair(
    textureBindGroupLayout,
    imageTextureBindGroup
  );

  let rainbowHoloPipeline = root['~unstable']
    .withVertex(mainVertex, {})
    .withFragment(
      rainbowHoloFragment,
      getDefaultTarget(presentationFormat, blend)
    )
    .createPipeline();

  rainbowHoloPipeline = attachBindGroups(rainbowHoloPipeline, [...BGP, texBGP]);
  return rainbowHoloPipeline;
};

export const pipelineRenderFunction = (
  root: TgpuRoot,
  pipelines: TgpuRenderPipeline[],
  attachments: any[],
  view: GPUTextureView,
  isInSinglePass: boolean
) => {
  if (isInSinglePass) {
    root['~unstable'].beginRenderPass(
      {
        colorAttachments: [
          {
            view: view,
            clearValue: [0, 0, 0, 0],
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      },
      (pass) => {
        for (let i = 0; i < pipelines.length; i++) {
          pass.setPipeline(pipelines[i]!);
          pass.draw(6);
        }
      }
    );
    root['~unstable'].flush();
  } else {
    for (let i = 0; i < pipelines.length; i++) {
      const attachment = attachments[i];
      if (!attachment) return;
      pipelines[i]!.withColorAttachment(attachment).draw(6);
    }
  }
};
