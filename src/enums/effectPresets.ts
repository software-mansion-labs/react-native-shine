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

const GLARE_FLARE = createEffect({
  fragment: glareFlareFragment,
  buffers: [
    {
      schema: glareFlareSchema,
      defaultOptions: {
        flareIntensity: 0.7, // Overall intensity of the flare
        spotIntensity: 0.4, // Intensity of the central spot
        ringIntensity: 0.1, // Intensity of the rings
        rayIntensity: 0.8, // Intensity of the rays
        falloff: 8.0, // Falloff factor for rings and spots
        rayCount: 4.0, // Number of rays
      },
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
type EffectsRecord = typeof Effects;

export type PipelineInput = {
  [K in keyof EffectsRecord]: EffectsRecord[K] & {
    options?: ExtractEffectOptions<EffectsRecord[K]>;
  };
}[keyof EffectsRecord];
