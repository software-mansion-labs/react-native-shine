import {
  type TgpuBuffer,
  type TgpuRoot,
  type TgpuTexture,
  type UniformFlag,
} from 'typegpu';
import * as d from 'typegpu/data';
import { rotationValuesBindGroupLayout } from './bindGroupLayouts';

export const createTexture = async (
  root: TgpuRoot,
  size: {
    width: number;
    height: number;
  }
): Promise<TgpuTexture> => {
  const texture = root['~unstable']
    .createTexture({
      size: [size.width, size.height],
      format: 'rgba8unorm',
    })
    .$usage('sampled', 'render');

  return texture;
};

export const loadTexture = async (
  root: TgpuRoot,
  imageBitmap: ImageBitmap,
  texture: TgpuTexture
) => {
  root.device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: root.unwrap(texture) },
    [imageBitmap.width, imageBitmap.height]
  );
};

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

//useSensors reanimated - gyroscope
