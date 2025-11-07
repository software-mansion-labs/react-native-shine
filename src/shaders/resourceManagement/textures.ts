import { type TextureProps, type TgpuRoot, type TgpuTexture } from 'typegpu';
import getBitmapFromURI from './bitmaps';

export const createTexture = async (
  root: TgpuRoot,
  size: {
    width: number;
    height: number;
  }
  //TODO: change any to the texture types (make a type that includes a union of all texture formats that are used)
): Promise<TgpuTexture<any>> => {
  const texture = root['~unstable'].createTexture({
    size: [size.width, size.height, 1],
    format: 'rgba8unorm',
  });

  return texture;
};

export const loadTexture = async (
  root: TgpuRoot,
  imageBitmap: ImageBitmap,
  texture: TgpuTexture<any>
) => {
  root.device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: root.unwrap(texture) },
    [imageBitmap.width, imageBitmap.height]
  );
};

export async function loadBitmap(
  root: TgpuRoot,
  imageURI: string,
  setTexture: (texture: TgpuTexture<TextureProps>) => void,
  usage: ('sampled' | 'render')[] = ['sampled', 'render']
) {
  const bitmap = await getBitmapFromURI(imageURI);
  let texture = await createTexture(root, bitmap);
  texture = await addTextureUsage(texture, usage);

  setTexture(texture);
  await loadTexture(root, bitmap, texture);
}

export async function addTextureUsage(
  texture: TgpuTexture,
  usage: ('sampled' | 'render')[]
) {
  return texture.$usage(...usage);
}
