import { c, Num } from '../common.ts';
import type { t } from '../common.ts';

export const spinnerText: t.CliFormatLib['spinnerText'] = (
  text,
  spacing: t.CliFormatSpinnerSpacing = true,
) => {
  return spinnerRaw(c.gray(c.italic(text)), spacing);
};

export const spinnerRaw: t.CliFormatLib['spinnerRaw'] = (
  text,
  spacing: t.CliFormatSpinnerSpacing = true,
) => {
  const [before, after] = wrangle.spacing(spacing);
  return `${'\n'.repeat(before)}${text}${'\n'.repeat(after)}`;
};

/**
 * Helpers:
 */
const wrangle = {
  spacing(input: t.CliFormatSpinnerSpacing): [number, number] {
    if (input === false) return [0, 0];
    if (input === true) return [0, 1];
    if (typeof input === 'number') {
      const n = wrangle.clamp(input);
      return [n, n];
    }
    return [wrangle.clamp(input[0]), wrangle.clamp(input[1])];
  },

  clamp(input: number): number {
    if (!Number.isFinite(input)) return 0;
    if (!Number.isInteger(input)) return 0;
    return Num.clamp(0, Num.MAX_INT, input);
  },
} as const;
