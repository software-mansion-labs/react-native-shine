import { useEffect } from 'react';
import { Canvas, useDevice, useGPUContext } from 'react-native-wgpu';
import { getOrInitRoot } from './roots';
import mainVertex from './shaders/vertexShaders/mainVertex';
import mainFragment from './shaders/fragmentShaders/mainFragment';
import getBitmapFromURI from './shaders/resourceManagement';
import { createTexture, loadTexture } from './shaders/utils';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

interface ShineProps {
  width?: number;
  height?: number;
  imageURI: string;
}

export function Shine({ width, height, imageURI }: ShineProps) {
  const { device = null } = useDevice();
  const root = device ? getOrInitRoot(device) : null;
  const { ref, context } = useGPUContext();
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  const wHeight = 200;
  const wWidth = 200;

  console.log(!!presentationFormat, !!device, !!context, !!root);

  useEffect(() => {
    if (!root) return;

    (async () => {
      const bitmap = await getBitmapFromURI(imageURI);
      const texture = await createTexture(root, bitmap);
      await loadTexture(root, bitmap, texture);
    })();
  }, [root, imageURI]);

  useEffect(() => {
    if (!root || !device || !context) return;

    context.configure({
      device: device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    const pipeline = root['~unstable']
      .withVertex(mainVertex, {})
      .withFragment(mainFragment, { format: presentationFormat })
      .createPipeline();

    pipeline
      .withColorAttachment({
        view: context.getCurrentTexture().createView(),
        clearValue: [0, 0, 0, 0],
        loadOp: 'clear',
        storeOp: 'store',
      })
      .draw(6);

    context.present();
  }, [device, context, root, presentationFormat]);

  return <Canvas ref={ref} style={{ width: wHeight, height: wWidth }} />;
}
