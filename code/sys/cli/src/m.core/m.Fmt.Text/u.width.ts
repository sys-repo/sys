import { stringWidth, type t } from '../common.ts';
import { terminal as isTerminal } from '../m.Is/u.terminal.ts';
import { Screen } from '../m.Screen/mod.ts';
import { nonNegativeInt, optionalPositiveInt } from './u.number.ts';

const DEFAULT_FALLBACK_WIDTH = 80;

export function visibleWidth(input: string): number {
  return stringWidth(input);
}

export function padEnd(input: string, width: number): string {
  const target = nonNegativeInt(width, 0);
  return `${input}${' '.repeat(Math.max(0, target - visibleWidth(input)))}`;
}

export function maxVisibleWidth(inputs: readonly string[]): number {
  return inputs.reduce((max, input) => Math.max(max, visibleWidth(input)), 0);
}

export function fitWidth(options: t.CliFormatTextFitOptions = {}): number {
  const width = sourceWidth(options);
  const maxWidth = optionalPositiveInt(options.maxWidth);
  const reserve = nonNegativeInt(options.reserve, 0);
  const minWidth = nonNegativeInt(options.minWidth, 0);
  const capped = maxWidth === undefined ? width : Math.min(width, maxWidth);
  const fitted = Math.max(0, capped - reserve);
  return minWidth > 0 && fitted < minWidth ? 0 : fitted;
}

/**
 * Helpers:
 */
function sourceWidth(options: t.CliFormatTextFitOptions): number {
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
