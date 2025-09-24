import type {
  TgpuBindGroup,
  TgpuRenderPipeline,
  TgpuRoot,
  TgpuTexture,
} from 'typegpu';
import type { BindGroupPair } from '../types/types';
import {
  maskTextureBindGroupLayout,
  textureBindGroupLayout,
} from './bindGroupLayouts';
import mainVertex from './vertexShaders/mainVertex';
import maskFragment from './fragmentShaders/maskFragment';
import { reverseHoloFragment } from './fragmentShaders/reverseHoloFragment';
import { holoFragment } from './fragmentShaders/holoFragment';
import {
  WAVE_CALLBACKS,
  waveCallbackFn,
  waveCallbackSlot,
} from '../enums/waveCallback';

export const attachBindGroups = (
  pipeline: TgpuRenderPipeline,
  bindGroups: TgpuBindGroup[]
) => {
  for (const bindGroup of bindGroups) {
    pipeline = pipeline.with(bindGroup.layout, bindGroup);
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
  maskTexture: TgpuTexture | undefined,
  bindGroups: TgpuBindGroup[],
  sampler: GPUSampler,
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

export const createReverseHoloPipeline = (
  root: TgpuRoot,
  texture: TgpuTexture | undefined,
  bindGroups: TgpuBindGroup[],
  sampler: GPUSampler,
  presentationFormat: GPUTextureFormat
): TgpuRenderPipeline | void => {
  if (!texture) return;

  const reverseHoloBindGroup = root.createBindGroup(
    maskTextureBindGroupLayout,
    {
      texture: root.unwrap(texture).createView(),
      sampler,
    }
  );
  const reverseHoloBGP: TgpuBindGroup[] = [...bindGroups, reverseHoloBindGroup];

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
  texture: TgpuTexture | undefined,
  bindGroups: TgpuBindGroup[],
  sampler: GPUSampler,
  presentationFormat: GPUTextureFormat
): TgpuRenderPipeline | void => {
  if (!texture) return;

  const imageTextureBindGroup = root.createBindGroup(textureBindGroupLayout, {
    texture: root.unwrap(texture).createView(),
    sampler,
  });

  let rainbowHoloPipeline = root['~unstable']
    .with(waveCallbackSlot, waveCallbackFn(WAVE_CALLBACKS.default))
    .withVertex(mainVertex, {})
    .withFragment(holoFragment, getDefaultTarget(presentationFormat, blend))
    .createPipeline();

  rainbowHoloPipeline = attachBindGroups(rainbowHoloPipeline, [
    ...bindGroups,
    imageTextureBindGroup,
  ]);
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
