import type { t } from './common.ts';

/** Tools for working with an elapsed duration of time. */
export type Lib = {
  /** Time duration conversions. */
  readonly To: To;

  /** Create a duration from milliseconds or an amount string; invalid amounts return an invalid instance. */
  create(duration: AmountInput, options?: Options): Instance;

  /** Parse an amount using the same grammar and validity contract as `create`. */
  parse(input: AmountInput, options?: Options): Instance;

  /** Format milliseconds to a display string. */
  format(msec: t.Msecs, unit: t.TimeUnit, round?: number): string;

  /**
   * Time elapsed between two instants, not duration-amount strings.
   * Reversed or non-finite differences return an invalid instance; unparseable strings throw.
   * @param start earlier instant (Unix ms, numeric string, or date string accepted by `Date.parse`).
   * @param end later instant (default `Date.now()`).
   */
  elapsed(start: InstantInput, end?: InstantInput, options?: Options): Instance;
};

/**
 * Milliseconds or a complete decimal amount with an optional unit (default: milliseconds).
 * Strings allow ASCII digits with one optional decimal point and at least one digit: '03s',
 * '.5s', '12.', and '2.50h'. Whitespace may surround the input or separate amount and unit.
 * Units are case-insensitive: ms/msec, s/sec, m/min, h/hour, d/day; a day is exactly 24 hours.
 * Signs, exponents, separators, internal numeric whitespace, and other suffixes are invalid.
 * The resulting milliseconds must be finite and non-negative; numeric -0 becomes 0.
 */
export type AmountInput = string | t.Msecs;

/** Unix milliseconds, numeric strings, or date strings accepted by `Date.parse`; not duration amounts. */
export type InstantInput = string | t.UnixTimestamp;

/** Compatibility alias of `AmountInput`; use `InstantInput` for elapsed endpoints. */
export type Input = AmountInput;

/** Options passed to a duration helper. */
export type Options = {
  /** Number of decimal places to round to. */
  round?: number;
};

/** Time duration conversions. */
export type To = {
  sec(msec: t.Msecs, round?: number): t.Secs;
  min(msec: t.Msecs, round?: number): t.Mins;
  hour(msec: t.Msecs, round?: number): t.Hours;
  day(msec: t.Msecs, round?: number): t.Days;
};

/**
 * A non-negative duration, or an invalid value with `ok: false` and -1 in every numeric field.
 * Invalid values format as '-1ms' by default; explicit units still convert and round that sentinel.
 */
export type Instance = t.TimeDuration;
