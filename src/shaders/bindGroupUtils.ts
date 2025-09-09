import { type TgpuBuffer, type TgpuRoot, type UniformFlag } from 'typegpu';
import * as d from 'typegpu/data';
import {
  glareOptionsBindGroupLayout,
  glareOptionsSchema,
  colorMaskBindGroupLayout,
  colorMaskSchema,
  rotationValuesBindGroupLayout,
} from './bindGroupLayouts';
import type {
  GlareOptions,
  ColorMask,
  PartiallyOptional,
} from '../types/types';
import {
  colorMaskToTyped,
  createGlareOptions,
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
  buffer: TgpuBuffer<d.Vec3f>
) => {
  const rotationValuesBindGroup = root.createBindGroup(
    rotationValuesBindGroupLayout,
    {
      vec: root.unwrap(buffer),
    }
  );

  return rotationValuesBindGroup;
};

export const createGlareOptionsBuffer = (
  root: TgpuRoot,
  initValues?: Partial<GlareOptions>
) => {
  const glareOptions: GlareOptions = createGlareOptions({ ...initValues });
  const glareOptionsTyped = mapToF32(glareOptions);

  const glareOptionsBuffer = root
    .createBuffer(glareOptionsSchema, glareOptionsTyped)
    .$usage('uniform');

  return glareOptionsBuffer;
};

export const createGlareOptionsBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<glareOptionsSchema> & UniformFlag
) => {
  const glareOptionsBindGroup = root.createBindGroup(
    glareOptionsBindGroupLayout,
    {
      glareOptions: buffer,
    }
  );

  return glareOptionsBindGroup;
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

// export const crateHoloBuffer = (
//   root: TgpuRoot,
//   initValues: Partial<HoloOptions>
// ) => {
//   const holoOptions: HoloOptions = createHoloOptions({ ...initValues });
//   const holoOptionsTyped = {
//     intensity: d.f32(holoOptions.intensity),
//     waveCallback: holoOptions.waveCallback,
//   };

//   const holoBuffer = root
//     .createBuffer(holoSchema, holoOptionsTyped)
//     .$usage('uniform');
// };
