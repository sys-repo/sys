import { type t, Color, Is } from '../common.ts';
import { Screen } from '../m.Screen/mod.ts';

const HR_FALLBACK_WIDTH = 80;

const HR_CHARS: Record<t.CliFormat.Hr.Weight, string> = {
  heavy: '━',
  light: '─',
  double: '═',
  dashed: '┄',
};

type HrInput = number | t.CliFormat.Hr.Color | t.CliFormat.Hr.Options | undefined;

export const hr: t.CliFormat.Lib['hr'] = (first?: HrInput, second?: t.CliFormat.Hr.Color) => {
  const options = wrangle.options(first, second);
  const width = wrangle.width(options.width);
  const line = wrangle.char(options.weight).repeat(width);

  return options.color ? Color.foreground[options.color](line) : line;
};

/**
 * Helpers:
 */
const wrangle = {
  options(first?: HrInput, second?: t.CliFormat.Hr.Color): t.CliFormat.Hr.Options {
    if (Is.number(first)) return { width: first, color: second };
    if (Is.string(first)) return { color: first };
    return first ?? {};
  },

  width(input?: number): number {
    if (Is.number(input)) return Math.max(0, input);
    const measured = Screen.size().width;
    return measured > 0 ? measured : HR_FALLBACK_WIDTH;
  },

  char(weight: t.CliFormat.Hr.Weight = 'heavy'): string {
    return HR_CHARS[weight];
  },
} as const;
