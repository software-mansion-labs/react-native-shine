import { useEffect, useState } from 'react';
import { useDevice } from 'react-native-wgpu';
import type { TgpuTexture } from 'typegpu';
import { getOrInitRoot } from '../roots';
import { loadBitmap } from '../shaders/resourceManagement/textures';
import Content, { type SharedProps } from './Content';

export interface ShineProps extends SharedProps {
  imageURI: string;
  maskURI?: string;
}

export function Shine({ imageURI, maskURI, ...props }: ShineProps) {
  const { device } = useDevice();
  const root = device && getOrInitRoot(device);
  const [imageTexture, setImageTexture] = useState<TgpuTexture>();
  const [maskTexture, setMaskTexture] = useState<TgpuTexture>();
  // const [colorMaskStorageTexture, colorMaskStorageTexture] =
  //   useState<TgpuTexture>();
  //TODO: complete the work with the compute shader, try out the shader

  useEffect(() => {
    if (root) loadBitmap(root, imageURI, setImageTexture);
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
      />
    )
  );
}
