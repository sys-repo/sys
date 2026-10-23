import { c, Num, type t } from '../common.ts';

export const spinnerText: t.CliFormat.Lib['spinnerText'] = (
  text,
  spacing: t.CliFormat.Spinner.Spacing = true,
) => {
  return spinnerRaw(c.gray(c.italic(text)), spacing);
};

export const spinnerRaw: t.CliFormat.Lib['spinnerRaw'] = (
  text,
  spacing: t.CliFormat.Spinner.Spacing = true,
) => {
  const [before, after] = wrangle.spacing(spacing);
  return `${'\n'.repeat(before)}${text}${'\n'.repeat(after)}`;
};

/**
 * Helpers:
 */
const wrangle = {
  spacing(input: t.CliFormat.Spinner.Spacing): [number, number] {
    if (input === false) return [0, 0];
    if (input === true) return [0, 1];
    if (typeof input === 'number') {
      const n = wrangle.clamp(input);
      return [n, n];
    }
    return [wrangle.clamp(input[0]), wrangle.clamp(input[1])];
  },

  clamp(input: number): number {
    if (!Num.Is.finite(input)) return 0;
    if (!Num.Is.int(input)) return 0;
    return Num.clamp(0, Num.MAX_INT, input);
  },
} as const;
