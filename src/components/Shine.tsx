import { useEffect, useState } from 'react';
import { useDevice } from 'react-native-wgpu';
import type { StorageFlag, TgpuTexture } from 'typegpu';
import { getOrInitRoot } from '../roots';
import {
  createTexture,
  loadBitmap,
} from '../shaders/resourceManagement/textures';
import Content, { type SharedProps } from './Content';
import getBitmapFromURI from '../shaders/resourceManagement/bitmaps';

export interface ShineProps extends SharedProps {
  imageURI: string;
  maskURI?: string;
}

export function Shine({ imageURI, maskURI, ...props }: ShineProps) {
  const { device } = useDevice();
  const root = device && getOrInitRoot(device);
  const [imageTexture, setImageTexture] = useState<TgpuTexture>();
  const [maskTexture, setMaskTexture] = useState<TgpuTexture>();
  const [colorMaskStorageTexture, setColorMaskStorageTexture] = useState<
    TgpuTexture<any> & StorageFlag
  >();
  //TODO: complete the work with the compute shader, try out the shader

  useEffect(() => {
    if (root) {
      loadBitmap(root, imageURI, setImageTexture);
      const makeStorage = async () => {
        const bitmap = await getBitmapFromURI(imageURI);
        const texture = (await createTexture(root, bitmap)).$usage(
          'storage',
          'sampled'
        );
        setColorMaskStorageTexture(texture);
      };
      makeStorage();
    }
  }, [root, imageURI]);

  useEffect(() => {
    if (root && maskURI) loadBitmap(root, maskURI, setMaskTexture);
  }, [root, imageURI, maskURI]);

  // useEffect(() => {
  //   //TODO: write the logic for allocating the storage texture for the precomputed colorMask
  //   if (root)
  // }, [root, imageURI]);

  return (
    root &&
    imageTexture && (
      <Content
        {...props}
        root={root}
        imageTexture={imageTexture}
        maskTexture={maskTexture}
        colorMaskStorageTexture={colorMaskStorageTexture}
      />
    )
  );
}
