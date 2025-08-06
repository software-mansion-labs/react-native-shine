import { type TgpuRoot, type TgpuTexture } from 'typegpu';

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

//useSensors reanimated - gyroscope
