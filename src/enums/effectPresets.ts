import {
  glareFlareSchema,
  glareSchema,
  holoSchema,
  reverseHoloDetectionChannelFlagsSchema,
} from '../shaders/bindGroupLayouts';
import {
  createGlareBindGroup,
  createGlareFlareBindGroup,
  createHoloBindGroup,
  createReverseHoloDetectionChannelFlagsBindGroup,
} from '../shaders/bindGroupUtils';
import {
  createEffect,
  type DeepPartial,
  type ExtractEffectOptions,
} from '../types/types';
import { glareFragment } from '../shaders/fragmentShaders/glareFragment';
import { reverseHoloFragment } from '../shaders/fragmentShaders/reverseHoloFragment';
import {
  doubleHoloFragment,
  holoFragment,
} from '../shaders/fragmentShaders/holoFragment';
import { glareFlareFragment } from '../shaders/fragmentShaders/glareFlareFragment';
import {
  GLARE_DEFAULTS,
  GLARE_FLARE_DEFAULTS,
  HOLO_DEFAULTS,
  REVERSE_HOLO_DEFAULTS,
} from './effectDefaults';
//TODO: move schema to separate object that would match them with corresponding bindGroups, then they would be defined in the effect

export const blend: GPUBlendState = {
  color: {
    srcFactor: 'one-minus-src-alpha',
    dstFactor: 'src-alpha',
    operation: 'add',
  } satisfies GPUBlendComponent,
  alpha: {
    srcFactor: 'one-minus-src-alpha',
    dstFactor: 'dst-alpha',
    operation: 'add',
  } satisfies GPUBlendComponent,
};

const GLARE = createEffect({
  buffers: [
    {
      schema: glareSchema,
      defaultOptions: GLARE_DEFAULTS,
    },
  ],
  bindGroupCreator: createGlareBindGroup,
  fragment: glareFragment,
});

const REVERSE_HOLO = createEffect({
  buffers: [
    { schema: glareSchema, defaultOptions: GLARE_DEFAULTS },
    {
      schema: reverseHoloDetectionChannelFlagsSchema,
      defaultOptions: REVERSE_HOLO_DEFAULTS,
    },
  ],
  fragment: reverseHoloFragment,
  bindGroupCreator: createReverseHoloDetectionChannelFlagsBindGroup,
  blend,
});

const HOLO = createEffect({
  fragment: holoFragment,
  buffers: [
    {
      schema: holoSchema,
      defaultOptions: HOLO_DEFAULTS,
    },
  ],
  bindGroupCreator: createHoloBindGroup,
  blend,
});

const DOUBLE_HOLO = { ...HOLO, fragment: doubleHoloFragment };

const GLARE_FLARE = createEffect({
  fragment: glareFlareFragment,
  buffers: [
    {
      schema: glareFlareSchema,
      defaultOptions: GLARE_FLARE_DEFAULTS,
    },
  ],
  bindGroupCreator: createGlareFlareBindGroup,
});

export const Effects = {
  glare: GLARE,
  reverseHolo: REVERSE_HOLO,
  holo: HOLO,
  doubleHolo: DOUBLE_HOLO,
  glareFlare: GLARE_FLARE,
} as const; //todo: add forced typings

export type Effect = {
  [K in keyof typeof Effects]: {
    name: K;
    options?: DeepPartial<ExtractEffectOptions<(typeof Effects)[K]>>;
  };
}[keyof typeof Effects];
