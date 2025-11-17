import type { Effect } from '../types/types';

export const Effects = {
  REVERSE_HOLO: {
    name: 'reverseHolo',
    options: { redChannel: 1.0, greenChannel: 0.0, blueChannel: 0.0 },
  },
  HOLO: {
    name: 'holo',
  },
} as const satisfies Record<string, Effect>;
