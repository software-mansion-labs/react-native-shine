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

export type SetStorageTexture = React.Dispatch<
  React.SetStateAction<(TgpuTexture<any> & StorageFlag) | undefined>
>;
export type SetSize = React.Dispatch<
  React.SetStateAction<{ width: number; height: number } | undefined>
>;

export function Shine({ imageURI, maskURI, ...props }: ShineProps) {
  const { device } = useDevice();
  const root = device && getOrInitRoot(device);
  const [imageTexture, setImageTexture] = useState<TgpuTexture>();
  const [maskTexture, setMaskTexture] = useState<TgpuTexture>();
  const [colorMaskStorageTextureSize, setColorMaskStorageTextureSize] =
    useState<{
      width: number;
      height: number;
    }>();
  const [colorMaskStorageTexture, setColorMaskStorageTexture] = useState<
    TgpuTexture<any> & StorageFlag
  >();

  const [gaussianBlurStorageTextureSize, setGaussianBlurStorageTextureSize] =
    useState<{
      width: number;
      height: number;
    }>();
  // Two textures for ping-pong blur passes
  const [gaussianBlurStorageTextureA, setGaussianBlurStorageTextureA] =
    useState<TgpuTexture<any> & StorageFlag>();
  const [gaussianBlurStorageTextureB, setGaussianBlurStorageTextureB] =
    useState<TgpuTexture<any> & StorageFlag>();

  useEffect(() => {
    if (root) {
      loadBitmap(root, imageURI, setImageTexture);
      const makeStorage = async (
        setTexture: SetStorageTexture,
        setSize: SetSize
      ) => {
        const bitmap = await getBitmapFromURI(imageURI);
        const texture = (await createTexture(root, bitmap)).$usage(
          'storage',
          'sampled'
        );
        setTexture(texture);
        setSize({
          width: bitmap.width,
          height: bitmap.height,
        });
      };
      makeStorage(setColorMaskStorageTexture, setColorMaskStorageTextureSize);
      // Create two textures for ping-pong blur
      makeStorage(
        setGaussianBlurStorageTextureA,
        setGaussianBlurStorageTextureSize
      );
      makeStorage(setGaussianBlurStorageTextureB, () => {});
    }
  }, [root, imageURI]);

  useEffect(() => {
    if (root && maskURI) loadBitmap(root, maskURI, setMaskTexture);
  }, [root, imageURI, maskURI]);

  return (
    root &&
    imageTexture && (
      <Content
        {...props}
        root={root}
        imageTexture={imageTexture}
        maskTexture={maskTexture}
        colorMaskStorageTexture={colorMaskStorageTexture}
        colorMaskStorageTextureSize={colorMaskStorageTextureSize}
        gaussianBlurStorageTextureA={gaussianBlurStorageTextureA}
        gaussianBlurStorageTextureB={gaussianBlurStorageTextureB}
        gaussianBlurStorageTextureSize={gaussianBlurStorageTextureSize}
      />
    )
  );
}
