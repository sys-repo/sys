import { c } from '../common.ts';
import type { t } from '../common.ts';

export const spinnerText: t.CliFormatLib['spinnerText'] = (
  text,
  spacing: t.CliFormatSpinnerSpacing = true,
) => {
  const [before, after] = wrangle.spacing(spacing);
  return `${'\n'.repeat(before)}${c.gray(c.italic(text))}${'\n'.repeat(after)}`;
};

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
    return Math.max(0, input);
  },
} as const;
