// Keep this authority dependency first: it establishes the trusted baseline before owned width data.
import {
  assertTextPresentationAuthority,
  runTextPresentationAuthority,
  TextIntrinsic,
  TextNumeric,
} from '../u/u.authority.ts';
import type { t } from '../../common.ts';
import { measureTerminalCells } from './u.measure.ts';
import { terminal as isTerminal } from '../../m.Is/u.terminal.ts';
import { Screen } from '../../m.Screen/mod.ts';
import {
  addSourceCodeUnits,
  assertOutputCodeUnits,
  assertWidthCollectionLength,
  publishTerminalCells,
} from '../u/u.budget.ts';
import { nonNegativeInt, optionalPositiveInt } from '../u/u.number.ts';

const DEFAULT_FALLBACK_WIDTH = 80;
const MALFORMED_MAX_LENGTH = TextIntrinsic.freeze(
  new Error('Cli.Fmt.Text Width.max input length invalid.'),
);

/** Measure terminal-cell occupancy while ignoring ANSI escape sequences. */
export function measure(input: string): number {
  assertTextPresentationAuthority();
  const text = typeof input === 'string' ? input : '';
  return publishTerminalCells(measureAdmitted(text));
}

/**
 * Measure an admitted primitive string. An internal maximum-plus-one sentinel preserves overflow
 * knowledge for clipping and wrapping; public width operations translate it to fixed refusal.
 */
export function measureAdmitted(input: string): number {
  return measureTerminalCells(input);
}

/** Append spaces up to the target cell width without truncating wider input. */
export function padEnd(input: string, width: number): string {
  assertTextPresentationAuthority();
  const text = typeof input === 'string' ? input : '';
  addSourceCodeUnits(0, text);
  const target = nonNegativeInt(width, 0);
  const padding = TextNumeric.max(0, target - measureAdmitted(text));
  assertOutputCodeUnits(text.length + padding);
  return padding === 0 ? text : `${text}${TextIntrinsic.stringRepeat(' ', padding)}`;
}

/** Return the greatest measured width, or zero when no strings are provided. */
export function max(inputs: string[]): number {
  assertTextPresentationAuthority();
  const rawLength: unknown = runTextPresentationAuthority(() => inputs.length);
  const length = admittedInputLength(rawLength);
  const admitted: string[] = [];
  let sourceCodeUnits = 0;

  for (let index = 0; index < length; index += 1) {
    const present = runTextPresentationAuthority(() => index in inputs);
    if (!present) continue;
    const input = runTextPresentationAuthority(() => inputs[index]);
    const text = typeof input === 'string' ? input : '';
    sourceCodeUnits = addSourceCodeUnits(sourceCodeUnits, text);
    TextIntrinsic.arrayPush(admitted, text);
  }

  let result = 0;
  for (let index = 0; index < admitted.length; index += 1) {
    result = TextNumeric.max(result, measureAdmitted(admitted[index]));
  }
  return publishTerminalCells(result);
}

/** Derive a usable cell budget from explicit, terminal, and fallback width policy. */
export function fit(options: t.CliFormatText.Width.Fit.Options = {}): number {
  assertTextPresentationAuthority();
  return fitWithScreen(Screen.size, options);
}

/** Package-internal screen measurement dependency seam. */
export function fitWithScreen(
  screenSize: typeof Screen.size,
  options: t.CliFormatText.Width.Fit.Options = {},
): number {
  assertTextPresentationAuthority();
  const explicit = optionalPositiveInt(readOption(options, 'width'));
  const maxWidth = optionalPositiveInt(readOption(options, 'maxWidth'));
  const reserve = nonNegativeInt(readOption(options, 'reserve'), 0);
  const minWidth = nonNegativeInt(readOption(options, 'minWidth'), 0);
  const width = sourceWidth(options, screenSize, explicit, maxWidth);
  const capped = maxWidth === undefined ? width : TextNumeric.min(width, maxWidth);
  const fitted = TextNumeric.max(0, capped - reserve);
  return minWidth > 0 && fitted < minWidth ? 0 : fitted;
}

/** Cell-width measurement and fitting implementation. */
export const Width: t.CliFormatText.Width.Lib = Object.freeze({ measure, padEnd, max, fit });

/**
 * Helpers:
 */
function sourceWidth(
  options: t.CliFormatText.Width.Fit.Options,
  screenSize: typeof Screen.size,
  explicit: number | undefined,
  maxWidth: number | undefined,
): number {
  if (explicit !== undefined) return explicit;

  const stream = readOption(options, 'stream') ?? 'stdout';
  const configuredTerminal = readOption(options, 'terminal');
  const terminal = configuredTerminal ?? runTextPresentationAuthority(() => isTerminal(stream));
  if (terminal) {
    const measured = runTextPresentationAuthority(screenSize);
    const measuredWidth = runTextPresentationAuthority(() => measured.width);
    const width = optionalPositiveInt(measuredWidth);
    if (width !== undefined) return width;
  }

  return optionalPositiveInt(readOption(options, 'fallbackWidth')) ?? maxWidth ??
    DEFAULT_FALLBACK_WIDTH;
}

function admittedInputLength(input: unknown): number {
  if (typeof input !== 'number' || !TextIntrinsic.numberIsFinite(input)) {
    throw MALFORMED_MAX_LENGTH;
  }
  const length = TextNumeric.floor(input);
  if (length <= 0) return 0;
  assertWidthCollectionLength(length);
  return length;
}

function readOption<
  K extends keyof t.CliFormatText.Width.Fit.Options,
>(
  options: t.CliFormatText.Width.Fit.Options,
  key: K,
): t.CliFormatText.Width.Fit.Options[K] {
  return runTextPresentationAuthority(() => options[key]);
}
