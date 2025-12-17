import type {
  StorageFlag,
  TgpuBuffer,
  TgpuRoot,
  ValidateStorageSchema,
  ValidateUniformSchema,
} from 'typegpu';
import type { AnyWgslData, Infer } from 'typegpu/data';
import { debug } from '../../config/debugMode';
import type { DeepPartial, TgpuUniformBuffer } from '../../types/types';
import { deepMerge } from '../utils';

export class BuffersMap extends Map<AnyWgslData, TgpuBuffer<AnyWgslData>> {
  constructor(private root: TgpuRoot) {
    super();
  }
  syncUniformBuffer<Key extends ValidateUniformSchema<AnyWgslData>>(
    schema: Key,
    defaultOptions: Infer<Key>,
    options?: DeepPartial<Infer<Key>>
  ): TgpuUniformBuffer<Key> {
    const resolvedOptions = options
      ? deepMerge(defaultOptions, options)
      : defaultOptions;

    if (this.has(schema)) {
      if (debug) {
        console.warn(
          `Buffer "${String(schema)}" already exists. Updating values.`
        );
      }

      const buffer = this.get(schema)!;
      buffer.write(resolvedOptions);
      return buffer as TgpuUniformBuffer<Key>;
    }

    const result = this.root.createUniform(
      schema as ValidateUniformSchema<Key>,
      resolvedOptions
    );
    const buffer = result.buffer;

    this.set(schema, buffer);

    return buffer;
  }

  syncStorageBuffer<Key extends ValidateStorageSchema<AnyWgslData>>(
    schema: Key,
    defaultOptions: Infer<Key>,
    options?: DeepPartial<Infer<Key>>
  ): TgpuBuffer<Key> & StorageFlag {
    const resolvedOptions = options
      ? deepMerge(defaultOptions, options)
      : defaultOptions;

    if (this.has(schema)) {
      if (debug) {
        console.warn(
          `Buffer "${String(schema)}" already exists. Updating values.`
        );
      }

      const buffer = this.get(schema)!;
      buffer.write(resolvedOptions);
      return buffer as TgpuBuffer<Key> & StorageFlag;
    }

    const result = this.root.createMutable(
      schema as ValidateStorageSchema<Key>,
      resolvedOptions
    );
    const buffer = result.buffer;

    this.set(schema, buffer);

    return buffer;
  }
}
