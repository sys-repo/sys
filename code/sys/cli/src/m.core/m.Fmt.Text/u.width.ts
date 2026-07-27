import { stringWidth, type t } from '../common.ts';
import { terminal as isTerminal } from '../m.Is/u.terminal.ts';
import { Screen } from '../m.Screen/mod.ts';
import { nonNegativeInt, optionalPositiveInt } from './u.number.ts';

const DEFAULT_FALLBACK_WIDTH = 80;

/** Measure terminal-cell occupancy while ignoring ANSI escape sequences. */
export function measure(input: string): number {
  return stringWidth(input);
}

/** Append spaces up to the target cell width without truncating wider input. */
export function padEnd(input: string, width: number): string {
  const target = nonNegativeInt(width, 0);
  return `${input}${' '.repeat(Math.max(0, target - measure(input)))}`;
}

/** Return the greatest measured width, or zero when no strings are provided. */
export function max(inputs: string[]): number {
  return inputs.reduce((current, input) => Math.max(current, measure(input)), 0);
}

/** Derive a usable cell budget from explicit, terminal, and fallback width policy. */
export function fit(options: t.CliFormatText.Width.Fit.Options = {}): number {
  const width = sourceWidth(options);
  const maxWidth = optionalPositiveInt(options.maxWidth);
  const reserve = nonNegativeInt(options.reserve, 0);
  const minWidth = nonNegativeInt(options.minWidth, 0);
  const capped = maxWidth === undefined ? width : Math.min(width, maxWidth);
  const fitted = Math.max(0, capped - reserve);
  return minWidth > 0 && fitted < minWidth ? 0 : fitted;
}

/** Cell-width measurement and fitting implementation. */
export const Width: t.CliFormatText.Width.Lib = { measure, padEnd, max, fit };

/**
 * Helpers:
 */
function sourceWidth(options: t.CliFormatText.Width.Fit.Options): number {
  const explicit = optionalPositiveInt(options.width);
  if (explicit !== undefined) return explicit;

  const stream = options.stream ?? 'stdout';
  const terminal = options.terminal ?? isTerminal(stream);
  if (terminal) {
    const measured = optionalPositiveInt(Screen.size().width);
    if (measured !== undefined) return measured;
  }

  return (
    optionalPositiveInt(options.fallbackWidth) ??
      optionalPositiveInt(options.maxWidth) ??
      DEFAULT_FALLBACK_WIDTH
  );
}
