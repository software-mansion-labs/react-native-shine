import { componentsFromV3d, zeroV3d } from 'react-native-shine';
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

export const createRotationBuffer = (root: TgpuRoot, initValues = zeroV3d) =>
  root
    .createBuffer(d.vec3f, d.vec3f(...componentsFromV3d(initValues)))
    .$usage('uniform');

export const createRotationValuesBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<d.Vec3f>
) =>
  root.createBindGroup(rotationValuesBindGroupLayout, {
    vec: root.unwrap(buffer),
  });

export const createGlareOptionsBuffer = (
  root: TgpuRoot,
  initValues?: Partial<GlareOptions>
) =>
  root
    .createBuffer(
      glareOptionsSchema,
      mapToF32(createGlareOptions({ ...initValues }))
    )
    .$usage('uniform');

export const createGlareOptionsBindGroup = (
  root: TgpuRoot,
  buffer: TgpuBuffer<glareOptionsSchema> & UniformFlag
) =>
  root.createBindGroup(glareOptionsBindGroupLayout, {
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
  buffer: TgpuBuffer<colorMaskSchema> & UniformFlag
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
