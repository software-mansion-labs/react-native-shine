import type { TgpuBuffer } from 'typegpu';

export class TypedBufferMap<TSchemas extends Record<string, any>> {
  private buffers: {
    [K in keyof TSchemas]?: TgpuBuffer<TSchemas[K]>;
  } = {};

  set<K extends keyof TSchemas>(key: K, buffer: TgpuBuffer<TSchemas[K]>): void {
    this.buffers[key] = buffer;
  }

  get<K extends keyof TSchemas>(key: K): TgpuBuffer<TSchemas[K]> | undefined {
    return this.buffers[key];
  }

  has<K extends keyof TSchemas>(key: K): boolean {
    return this.buffers[key] !== undefined;
  }

  delete<K extends keyof TSchemas>(key: K): void {
    const buf = this.buffers[key];
    if (buf) {
      buf.destroy?.();
      delete this.buffers[key];
    }
  }

  keys(): (keyof TSchemas)[] {
    return Object.keys(this.buffers) as (keyof TSchemas)[];
  }

  entries(): [keyof TSchemas, TgpuBuffer<TSchemas[keyof TSchemas]>][] {
    return Object.entries(this.buffers) as [
      keyof TSchemas,
      TgpuBuffer<TSchemas[keyof TSchemas]>,
    ][];
  }
}
