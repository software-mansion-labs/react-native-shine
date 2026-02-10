import type {
  TextureProps,
  TgpuBindGroup,
  TgpuComputeFn,
  TgpuComputePipeline,
  TgpuRenderPipeline,
  TgpuRoot,
  TgpuTexture,
} from 'typegpu';
import { vec3f } from 'typegpu/data';
import mainVertex from '../vertexShaders/mainVertex';
import type {
  AnySchema,
  BufferConfig,
  ColorAttachment,
  FragmentShaderReturnType,
  FragmentType,
  UnwrapLayout,
} from '../../types/types';
import { baseTextureFragment } from '../fragmentShaders/baseTextureFragment';
import {
  sharedBindGroupLayout,
  rotationSchema,
  maskTextureBindGroupLayout,
} from '../bindGroupLayouts';
import { BuffersMap } from './buffersMap';
import { Effects } from '../../enums/effectPresets';

type PipelineMap<Key> = Map<Key, TgpuRenderPipeline<FragmentShaderReturnType>>;
type ComputePipelineMap<Key> = Map<Key, TgpuComputePipeline>;

const defaultAttachment = {
  clearValue: [0, 0, 0, 0],
  loadOp: 'load',
  storeOp: 'store',
} as const;

export class PipelineManager {
  sharedBindGroup: TgpuBindGroup<UnwrapLayout<typeof sharedBindGroupLayout>>;
  maskBindGroup: TgpuBindGroup<UnwrapLayout<typeof maskTextureBindGroupLayout>>;
  buffersMap: BuffersMap;
  pipelinesMap: PipelineMap<FragmentType>;
  computePipelinesMap: ComputePipelineMap<TgpuComputeFn>;
  constructor(
    private root: TgpuRoot,
    private presentationFormat: GPUTextureFormat,
    imageTexture: TgpuTexture<TextureProps>,
    maskTexture?: TgpuTexture<TextureProps>
  ) {
    this.buffersMap = new BuffersMap(root);
    this.pipelinesMap = new Map();
    const rotationBuffer = this.buffersMap.syncUniformBuffer(
      rotationSchema,
      vec3f(0.0)
    );
    this.computePipelinesMap = new Map();

    const sampler = root['~unstable'].createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    });
    this.sharedBindGroup = root.createBindGroup(sharedBindGroupLayout, {
      texture: root.unwrap(imageTexture).createView(),
      sampler,
      rot: rotationBuffer,
    });
    //todo: make this optional and create when needed
    this.maskBindGroup = root.createBindGroup(maskTextureBindGroupLayout, {
      texture: root.unwrap(maskTexture || imageTexture).createView(),
      sampler,
    });
  }

  addPipeline(
    fragment: FragmentType,
    bindGroupProp?: TgpuBindGroup[],
    blend?: GPUBlendState
  ) {
    if (this.pipelinesMap.has(fragment)) {
      return this.pipelinesMap.get(fragment);
    }

    let pipeline = this.root['~unstable']
      .withVertex(mainVertex, {})
      .withFragment(fragment, { format: this.presentationFormat, blend })
      .createPipeline();

    let bindGroups: TgpuBindGroup<any>[] = [this.sharedBindGroup];

    if (bindGroupProp) {
      bindGroups = [...bindGroups, ...bindGroupProp];
    }

    for (const bindGroup of bindGroups) {
      pipeline = pipeline.with(bindGroup);
    }

    this.pipelinesMap.set(fragment, pipeline);
    return pipeline;
  }

  addComputePipeline(compute: TgpuComputeFn, bindGroupProp?: TgpuBindGroup[]) {
    if (this.computePipelinesMap.has(compute)) {
      return this.computePipelinesMap.get(compute);
    }

    let pipeline = this.root['~unstable'].withCompute(compute).createPipeline();
    let bindGroups: TgpuBindGroup<any>[] = [this.sharedBindGroup];
    if (bindGroupProp) {
      bindGroups = [...bindGroups, ...bindGroupProp];
    }

    for (const bindGroup of bindGroups) {
      pipeline = pipeline.with(bindGroup);
    }

    this.computePipelinesMap.set(compute, pipeline);
    return pipeline;
  }

  // For compute pipelines that don't use the shared bind group (e.g., ping-pong blur)
  addComputePipelineWithoutShared(
    compute: TgpuComputeFn,
    bindGroups: TgpuBindGroup[]
  ) {
    // Always recreate to allow different bind groups for each pass
    let pipeline = this.root['~unstable'].withCompute(compute).createPipeline();

    for (const bindGroup of bindGroups) {
      pipeline = pipeline.with(bindGroup);
    }

    this.computePipelinesMap.set(compute, pipeline);
    return pipeline;
  }

  //TODO: fix any typing
  addPipelineWithBuffer(
    name: keyof typeof Effects,
    options?: any,
    extraBindGroups?: TgpuBindGroup[]
  ) {
    const { fragment, blend, buffers, bindGroupCreator } = Effects[name];

    const genericBuffers = buffers as readonly BufferConfig<AnySchema>[];

    const updatedBuffers = genericBuffers.map(({ schema, defaultOptions }) =>
      this.buffersMap.syncUniformBuffer(schema, defaultOptions, options)
    );

    if (this.pipelinesMap.has(fragment)) {
      return this.pipelinesMap.get(fragment);
    }

    const bindGroup = bindGroupCreator(
      { root: this.root, maskBindGroup: this.maskBindGroup },
      updatedBuffers as any
    );

    const allBindGroups = extraBindGroups
      ? [...bindGroup, ...extraBindGroups]
      : bindGroup;

    return this.addPipeline(fragment, allBindGroups, blend);
  }

  runComputePipeline(
    compute: TgpuComputeFn,
    textureSize: { width: number; height: number }
  ) {
    const pipeline = this.computePipelinesMap.get(compute);
    if (!pipeline) {
      throw new Error('Compute pipeline not found');
    }

    console.log('Running compute pipeline with size:', textureSize);
    pipeline.dispatchWorkgroups(
      Math.ceil(textureSize.width / 8),
      Math.ceil(textureSize.height / 8),
      1
    );
  }

  renderPipelines(view: GPUTextureView) {
    this.pipelinesMap.forEach((pipeline, fragment) => {
      const attachment: ColorAttachment = {
        ...defaultAttachment,
        view,
      };

      if (fragment === baseTextureFragment) {
        attachment.loadOp = 'clear';
      }

      pipeline.withColorAttachment(attachment).draw(6);
    });
  }
}
