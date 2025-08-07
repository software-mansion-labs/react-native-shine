import { useEffect, useRef, useState } from 'react';
import { Canvas, useDevice, useGPUContext } from 'react-native-wgpu';
import { getOrInitRoot } from './roots';
import mainVertex from './shaders/vertexShaders/mainVertex';
import mainFragment from './shaders/fragmentShaders/mainFragment';
import getBitmapFromURI from './shaders/resourceManagement';
import {
  createRotationBuffer,
  createRotationValuesBindGroup,
  createTexture,
  loadTexture,
} from './shaders/utils';
import type { TgpuTexture } from 'typegpu';
import {
  rotationValuesBindGroupLayout,
  textureBindGroupLayout,
} from './shaders/bindGroupLayouts';
import {
  SensorType,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';

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
  const frameRef = useRef<number | null>(null);

  const [imageTexture, setImageTexture] = useState<TgpuTexture | null>(null);
  const rotationShared = useSharedValue<number[]>([0, 0, 0]);

  const rotation = useAnimatedSensor(SensorType.ROTATION, {
    interval: 20,
  });
  useDerivedValue(() => {
    const { qw, qx, qy, qz } = rotation.sensor.value;
    const forward: [number, number, number] = [0, 0, -1];

    // 2. Quaternion vector part
    const q: [number, number, number] = [qx, qy, qz];

    // STEP 1: q × v
    const t: [number, number, number] = [
      q[1] * forward[2] - q[2] * forward[1],
      q[2] * forward[0] - q[0] * forward[2],
      q[0] * forward[1] - q[1] * forward[0],
    ];

    // STEP 2: t2 = qw * forward + t
    const t2: [number, number, number] = [
      qw * forward[0] + t[0],
      qw * forward[1] + t[1],
      qw * forward[2] + t[2],
    ];

    // STEP 3: rotated = forward + 2.0 * cross(q, t2)
    const crossQT2: [number, number, number] = [
      q[1] * t2[2] - q[2] * t2[1],
      q[2] * t2[0] - q[0] * t2[2],
      q[0] * t2[1] - q[1] * t2[0],
    ];

    const rotated: [number, number, number] = [
      forward[0] + 2.0 * crossQT2[0],
      forward[1] + 2.0 * crossQT2[1],
      forward[2] + 2.0 * crossQT2[2],
    ];

    // Extract X and Y for 2D glow offset.
    let [offsetX, offsetY, offsetZ] = [rotated[0], rotated[1], rotated[2]];
    offsetY = offsetY;

    const clamp = (v: number, min = -1, max = 1) =>
      Math.max(min, Math.min(max, v));
    const scale = 0.5;

    offsetX = clamp(offsetX * scale);
    offsetY = clamp(offsetY * scale);

    rotationShared.set([offsetX, offsetY, offsetZ]);
  });

  useEffect(() => {
    if (!root || !device || !context) return;

    console.log('RESOURCE SETUP');
    (async () => {
      console.log('---------------------------------------LOADING BITMAP');
      const bitmap = await getBitmapFromURI(imageURI);
      console.log('---------------------------------------DONE');

      const texture = await createTexture(root, bitmap);
      setImageTexture(texture);
      await loadTexture(root, bitmap, texture);
    })();
  }, [root, device, context, imageURI]);

  useEffect(() => {
    if (!root || !device || !context || !imageTexture) return;

    context.configure({
      device: device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    const imageSampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const textureBindGroup = root.createBindGroup(textureBindGroupLayout, {
      texture: root.unwrap(imageTexture).createView(),
      sampler: imageSampler,
    });

    const rotationBuffer = createRotationBuffer(root);
    const rotationValuesBindGroup = createRotationValuesBindGroup(
      root,
      rotationBuffer
    );

    const pipeline = root['~unstable']
      .withVertex(mainVertex, {})
      .withFragment(mainFragment, { format: presentationFormat })
      .createPipeline()
      .with(textureBindGroupLayout, textureBindGroup)
      .with(rotationValuesBindGroupLayout, rotationValuesBindGroup);

    const render = () => {
      console.log(rotationShared.get());
      const rot = rotationShared.get();
      rotationBuffer.write(d.vec3f(rot[0]!, rot[1]!, rot[2]!));

      pipeline
        .withColorAttachment({
          view: context.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 0],
          loadOp: 'clear',
          storeOp: 'store',
        })
        .draw(6);

      context.present();
      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [device, context, root, presentationFormat, imageTexture, rotationShared]);

  return <Canvas ref={ref} style={{ width: width, height: height }} />;
}
