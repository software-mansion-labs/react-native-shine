import type { TgpuRoot, TgpuBuffer, ValidateBufferSchema } from 'typegpu';

// You already have this
export type BufferUsageType = 'uniform' | 'storage' | 'vertex';

type BufferWithUsageFromEntry<
  TEntry extends { schema: ValidateBufferSchema<any>; usage: BufferUsageType },
> = TEntry['usage'] extends 'uniform'
  ? TgpuBuffer<TEntry['schema']> & { usableAsUniform: true }
  : TEntry['usage'] extends 'storage'
    ? TgpuBuffer<TEntry['schema']> & { usableAsStorage: true }
    : TEntry['usage'] extends 'vertex'
      ? TgpuBuffer<TEntry['schema']> & { usableAsVertex: true }
      : never;

export class TypedBufferMap<
  TSchemas extends Record<
    string,
    { schema: ValidateBufferSchema<any>; usage: BufferUsageType }
  >,
> {
  private buffers: {
    [K in keyof TSchemas]?: BufferWithUsageFromEntry<TSchemas[K]>;
  } = {};

  constructor(private schemas: TSchemas) {}

  set<K extends keyof TSchemas>(
    key: K,
    buffer: BufferWithUsageFromEntry<TSchemas[K]>
  ): void {
    this.buffers[key] = buffer;
  }

  get<K extends keyof TSchemas>(
    key: K
  ): BufferWithUsageFromEntry<TSchemas[K]> | undefined {
    return this.buffers[key];
  }

  addBuffer<K extends keyof TSchemas>(
    root: TgpuRoot,
    key: K,
    initValues?: TSchemas[K]['schema']['_TSType']
  ): BufferWithUsageFromEntry<TSchemas[K]> {
    const entry = this.schemas[key];
    if (!entry) {
      throw new Error(`No schema found for buffer key "${String(key)}"`);
    }

    const { schema, usage } = entry;
    if (this.buffers[key]) {
      console.warn(`Buffer "${String(key)}" already exists. Skipping...`);
      return this.buffers[key]!;
    }

    const buffer = initValues
      ? root.createBuffer(schema, initValues)
      : root.createBuffer(schema);

    const typedBuffer = buffer.$usage(usage) as BufferWithUsageFromEntry<
      TSchemas[K]
    >;
    this.buffers[key] = typedBuffer;
    return typedBuffer;
  }

  keys(): (keyof TSchemas)[] {
    return Object.keys(this.buffers) as (keyof TSchemas)[];
  }

  has<K extends keyof TSchemas>(key: K): boolean {
    return !!this.buffers[key];
  }

  delete<K extends keyof TSchemas>(key: K): void {
    const buf = this.buffers[key];
    if (buf) {
      buf.destroy?.();
      delete this.buffers[key];
    }
  }
}
