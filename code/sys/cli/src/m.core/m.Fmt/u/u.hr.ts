import { Color, Is, Num, type t } from '../common.ts';
import { Screen } from '../../m.Screen/mod.ts';

type HrInput = number | t.CliFormat.Hr.Color | t.CliFormat.Hr.Options | undefined;

const HR_FALLBACK_WIDTH = 80;
const HR_CHARS: Record<t.CliFormat.Hr.Weight, string> = {
  heavy: '━',
  light: '─',
  double: '═',
  dashed: '┄',
};

export const hr: t.CliFormat.Lib['hr'] = (first?: HrInput, second?: t.CliFormat.Hr.Color) => {
  return hrWithScreen(Screen.size, first, second);
};

/** Package-internal screen measurement dependency seam. */
export function hrWithScreen(
  screenSize: typeof Screen.size,
  first?: HrInput,
  second?: t.CliFormat.Hr.Color,
): string {
  const options = wrangle.options(first, second);
  const width = wrangle.width(options.width, screenSize);
  const char = wrangle.char(options.weight);

  if (options.progress !== undefined) return wrangle.progressLine(options, width, char);

  const line = char.repeat(width);
  return options.color ? Color.foreground[options.color](line) : line;
}

/**
 * Helpers:
 */
const wrangle = {
  options(first?: HrInput, second?: t.CliFormat.Hr.Color): t.CliFormat.Hr.Options {
    if (Is.number(first)) return { width: first, color: second };
    if (Is.string(first)) return { color: first };
    return first ?? {};
  },

  width(input: number | undefined, screenSize: typeof Screen.size): number {
    if (Is.number(input)) return Math.max(0, input);
    const measured = screenSize().width;
    return measured > 0 ? measured : HR_FALLBACK_WIDTH;
  },

  char(weight: t.CliFormat.Hr.Weight = 'heavy'): string {
    return HR_CHARS[weight];
  },

  segment(text: string, color: t.CliFormat.Hr.Color): string {
    return text ? Color.foreground[color](text) : '';
  },

  progressLine(options: t.CliFormat.Hr.Options, width: number, char: string): string {
    if (options.progress === undefined) return '';
    const progress = wrangle.progress(options.progress);
    const total = Math.max(0, Math.floor(width));
    const indicatorWidth = Math.floor(total * progress.percent);
    const trackWidth = total - indicatorWidth;
    const indicator = char.repeat(indicatorWidth);
    const track = char.repeat(trackWidth);
    const indicatorColor = progress.color?.indicator ?? options.color ?? 'green';
    const trackColor = progress.color?.track ?? 'gray';
    return wrangle.segment(indicator, indicatorColor) + wrangle.segment(track, trackColor);
  },

  progress(input: t.CliFormat.Hr.Progress.Input): t.CliFormat.Hr.Progress.Options {
    if (Is.number(input)) return { percent: wrangle.percent(input) };
    if (!Is.object(input)) return { percent: 0 };
    return { ...input, percent: wrangle.percent(input.percent) };
  },

  percent(input?: t.Percent): t.Percent {
    return Num.Percent.clamp(Is.number(input) ? input : 0);
  },
} as const;
