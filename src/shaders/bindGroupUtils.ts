import { type TgpuBuffer, type TgpuRoot, type UniformFlag } from 'typegpu';
import * as d from 'typegpu/data';
import {
  bloomOptionsBindGroupLayout,
  bloomOptionsSchema,
  colorMaskBindGroupLayout,
  colorMaskSchema,
  rotationValuesBindGroupLayout,
} from './bindGroupLayouts';
import type {
  BloomOptions,
  ColorMask,
  PartiallyOptional,
} from '../types/types';
import {
  colorMaskToTyped,
  createBloomOptions,
  createColorMask,
  mapToF32,
} from '../types/typeUtils';

export const createRotationBuffer = (
  root: TgpuRoot,
  initValues?: { x: number; y: number; z: number }
) => {
  const init = initValues
    ? d.vec3f(initValues.x, initValues.y, initValues.z)
    : d.vec3f(0.0);
  const rotationValuesBuffer = root
    .createBuffer(d.vec3f, init)
    .$usage('uniform');

  return rotationValuesBuffer;
};

export const createRotationValuesBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<d.Vec3f> & UniformFlag
) => {
  const rotationValuesBindGroup = root.createBindGroup(
    rotationValuesBindGroupLayout,
    {
      vec: buffer,
    }
  );

  return rotationValuesBindGroup;
};

export const createBloomOptionsBuffer = (
  root: TgpuRoot,
  initValues?: Partial<BloomOptions>
) => {
  const bloomOptions: BloomOptions = createBloomOptions({ ...initValues });
  const bloomOptionsTyped = mapToF32(bloomOptions);

  const bloomOptionsBuffer = root
    .createBuffer(bloomOptionsSchema, bloomOptionsTyped)
    .$usage('uniform');

  return bloomOptionsBuffer;
};

export const createBloomOptionsBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<bloomOptionsSchema> & UniformFlag
) => {
  const bloomOptionsBindGroup = root.createBindGroup(
    bloomOptionsBindGroupLayout,
    {
      bloomOptions: buffer,
    }
  );

  return bloomOptionsBindGroup;
};

export const createColorMaskBuffer = (
  root: TgpuRoot,
  initValues: PartiallyOptional<ColorMask, 'baseColor'>
) => {
  const colorMask: ColorMask = createColorMask({ ...initValues });
  const colorMaskTyped = colorMaskToTyped(colorMask);

  const colorMaskBuffer = root
    .createBuffer(colorMaskSchema, colorMaskTyped)
    .$usage('uniform');

  return colorMaskBuffer;
};

export const createColorMaskBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<colorMaskSchema> & UniformFlag
) => {
  const colorMaskBindGroup = root.createBindGroup(colorMaskBindGroupLayout, {
    mask: buffer,
  });

  return colorMaskBindGroup;
};
