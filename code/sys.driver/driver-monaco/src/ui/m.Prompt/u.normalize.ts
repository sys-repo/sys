import { type t, D, Is, Num } from './common.ts';

export const normalize: t.EditorPrompt.NormalizeConfig = (config) => {
  const min = wrangle.toLine(config?.lines?.min, D.lineCount);
  const maxInput = wrangle.toLine(config?.lines?.max, min);
  const max = Num.clamp(min, Num.MAX_INT, maxInput);

  return {
    lines: { min, max },
    overflow: config?.overflow ?? 'scroll',
    enter: {
      enter: config?.enter?.enter ?? D.enterPolicy.enter,
      modEnter: config?.enter?.modEnter ?? D.enterPolicy.modEnter,
    },
  };
};

/**
 * Helpers:
 */
const wrangle = {
  toLine(input: number | undefined, fallback: number) {
    const n = Is.num(input) ? Math.trunc(input) : fallback;
    return Num.clamp(1, Num.MAX_INT, n);
  },
} as const;
