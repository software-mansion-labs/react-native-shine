import { type TgpuBuffer, type TgpuRoot, type UniformFlag } from 'typegpu';
import {
  colorMaskBindGroupLayout,
  type GlareSchema,
  type ReverseHoloDetectionChannelFlagsSchema,
  reverseHoloDetectionChannelFlagsBindGroupLayout,
  type ColorMaskArraySchema,
  glareBindGroupLayout,
  holoBindGroupLayout,
  type HoloSchema,
} from './bindGroupLayouts';
import type {
  BindGroupCreatorArgument,
  TgpuUniformBuffer,
} from '../types/types';

export const createGlareBindGroup = (
  { root }: BindGroupCreatorArgument,
  [buffer]: readonly [buffer: TgpuUniformBuffer<GlareSchema>]
) => [
  root.createBindGroup(glareBindGroupLayout, {
    glareOptions: buffer,
  }),
];

export const createReverseHoloDetectionChannelFlagsBindGroup = (
  { root, maskBindGroup }: BindGroupCreatorArgument,
  [glareOptions, channelFlags]: readonly [
    g: TgpuUniformBuffer<GlareSchema>,
    f: TgpuUniformBuffer<ReverseHoloDetectionChannelFlagsSchema>,
  ]
) => {
  const reverseHoloBindGroup = root.createBindGroup(
    reverseHoloDetectionChannelFlagsBindGroupLayout,
    {
      channelFlags,
      glareOptions,
    }
  );
  return [reverseHoloBindGroup, maskBindGroup];
};

export const createColorMaskBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<ColorMaskArraySchema> & UniformFlag
) =>
  root.createBindGroup(colorMaskBindGroupLayout, {
    colorMasks: buffer,
  });

export const createHoloBindGroup = (
  { root }: BindGroupCreatorArgument,
  [buffer]: readonly [buffer: TgpuUniformBuffer<HoloSchema>]
) => [
  root.createBindGroup(holoBindGroupLayout, {
    holoOptions: buffer,
  }),
];
