import {
  glareSchema,
  holoSchema,
  reverseHoloDetectionChannelFlagsSchema,
} from '../shaders/bindGroupLayouts';
import {
  createGlareBindGroup,
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
      defaultOptions: {
        glowPower: 0.5,
        glareIntensity: 0.4,
        lightIntensity: 1.1,
        glareColor: {
          hueBlendPower: 1.0,
          hueShiftAngleMin: -30,
          hueShiftAngleMax: 30,
        },
      },
    },
  ],
  bindGroupCreator: createGlareBindGroup,
  fragment: glareFragment,
});

const REVERSE_HOLO = createEffect({
  buffers: [
    { schema: glareSchema, defaultOptions: GLARE.buffers[0].defaultOptions },
    {
      schema: reverseHoloDetectionChannelFlagsSchema,
      defaultOptions: {
        redChannel: 1.0,
        greenChannel: 0.0,
        blueChannel: 0.0,
        hue: 0.0,
        saturation: 0.0,
        value: 0.0,
      },
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
      defaultOptions: {
        directionDegree: 45,
        shift: 0.1,
        rotationShiftPower: 0.6,
        holoSize: 0.12,
        holoMultiplier: 2.5,
        holoEaseSize: 0.2,
        holoVisibility: 0.88,
        holoSaturation: 0.5,
      },
    },
  ],
  bindGroupCreator: createHoloBindGroup,
  blend,
});

const DOUBLE_HOLO = { ...HOLO, fragment: doubleHoloFragment };

export const Effects = {
  glare: GLARE,
  reverseHolo: REVERSE_HOLO,
  holo: HOLO,
  doubleHolo: DOUBLE_HOLO,
} as const; //todo: add forced typings

export type Effect = {
  [K in keyof typeof Effects]: {
    name: K;
    options?: DeepPartial<ExtractEffectOptions<(typeof Effects)[K]>>;
  };
}[keyof typeof Effects];
type EffectsRecord = typeof Effects;

export type PipelineInput = {
  [K in keyof EffectsRecord]: EffectsRecord[K] & {
    options?: ExtractEffectOptions<EffectsRecord[K]>;
  };
}[keyof EffectsRecord];
