import { tgpu, type TgpuRoot } from 'typegpu';

const deviceToRootMap = new WeakMap<GPUDevice, TgpuRoot>();

function getOrInitRoot(device: GPUDevice): TgpuRoot {
  let root = deviceToRootMap.get(device);

  if (!root) {
    root = tgpu.initFromDevice({ device });
    deviceToRootMap.set(device, root);
  }

  return root;
}

export { getOrInitRoot };
