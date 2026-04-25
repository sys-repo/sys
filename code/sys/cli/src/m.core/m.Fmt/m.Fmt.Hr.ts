import { type t, Color, Is } from '../common.ts';
import { Screen } from '../m.Screen/mod.ts';

const HR_CHAR = '━';
const HR_DEFAULT_WIDTH = 84;

type HrInput = number | t.CliFormat.Hr.Color | t.CliFormat.Hr.Options | undefined;

export const hr: t.CliFormatLib['hr'] = (first?: HrInput, second?: t.CliFormat.Hr.Color) => {
  const options = wrangle.options(first, second);
  const width = wrangle.width(options.width);
  const line = HR_CHAR.repeat(width);

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
    return measured > 0 ? measured : HR_DEFAULT_WIDTH;
  },
} as const;
