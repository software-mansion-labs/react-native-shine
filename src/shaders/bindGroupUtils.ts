import { componentsFromV3d, zeroV3d } from 'react-native-shine';
import { type TgpuBuffer, type TgpuRoot, type UniformFlag } from 'typegpu';
import * as d from 'typegpu/data';
import {
  glareBindGroupLayout,
  glareSchema,
  colorMaskBindGroupLayout,
  type ColorMaskSchema,
  rotationBindGroupLayout,
  type GlareSchema,
  colorMaskSchema,
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

export const createRotationBuffer = (root: TgpuRoot, initValues = zeroV3d) =>
  root
    .createBuffer(d.vec3f, d.vec3f(...componentsFromV3d(initValues)))
    .$usage('uniform');

export const createRotationValuesBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<d.Vec3f>
) =>
  root.createBindGroup(rotationBindGroupLayout, {
    vec: root.unwrap(buffer),
  });

export const createGlareOptionsBuffer = (
  root: TgpuRoot,
  initValues?: Partial<GlareOptions>
) =>
  root
    .createBuffer(glareSchema, mapToF32(createGlareOptions({ ...initValues })))
    .$usage('uniform');

export const createGlareBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<GlareSchema> & UniformFlag
) =>
  root.createBindGroup(glareBindGroupLayout, {
    glareOptions: buffer,
  });

export const createColorMaskBuffer = (
  root: TgpuRoot,
  initValues: PartiallyOptional<ColorMask, 'baseColor'>
) =>
  root
    .createBuffer(
      colorMaskSchema,
      colorMaskToTyped(createColorMask({ ...initValues }))
    )
    .$usage('uniform');

export const createColorMaskBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<ColorMaskSchema> & UniformFlag
) =>
  root.createBindGroup(colorMaskBindGroupLayout, {
    mask: buffer,
  });

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
