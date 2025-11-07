import tgpu, { type TgpuFn } from 'typegpu';
import * as std from 'typegpu/std';
import * as d from 'typegpu/data';

const defaultWave = (pos: d.v2f) => {
  'use gpu';

  const x = pos.x;
  const y = pos.y;

  const waveX = std.sin(x * 2.0);
  const waveY = std.cos(y * 2.0);

  return d.vec2f(waveX, waveY);
};

export const WAVE_CALLBACKS = {
  default: defaultWave,
} as const;

export const waveCallbackSlot = tgpu.slot<TgpuFn<(pos: d.Vec2f) => d.Vec2f>>();

export type WaveCallbackFn = (pos: d.v2f) => d.v2f;
export const waveCallbackFn = tgpu.fn([d.vec2f], d.vec2f);
