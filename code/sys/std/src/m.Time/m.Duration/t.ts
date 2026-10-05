import type { t } from './common.ts';

/** Duration parsing, conversion, and elapsed-time calculations. */
export type Lib = {
  /** Fixed-unit arithmetic, independent of duration validity. */
  readonly To: To;

  /** Create a duration from milliseconds or an amount string; invalid amounts return `ok: false`. */
  readonly create: (duration: AmountInput, options?: Options) => Instance;

  /** Parse an amount using the same grammar and validity contract as `create`. */
  readonly parse: (input: AmountInput, options?: Options) => Instance;

  /** Format milliseconds in a fixed unit without validating them as a duration amount. */
  readonly format: (msec: t.Msecs, unit: t.TimeUnit, round?: number) => string;

  /**
   * Time elapsed between two instants, not duration-amount strings.
   * Reversed or non-finite differences return an invalid instance; unparseable strings throw.
   *
   * @param start The earlier instant: Unix ms, a numeric string, or a string accepted by `Date.parse`.
   * @param end The later instant; defaults to `Date.now()`.
   */
  readonly elapsed: (start: InstantInput, end?: InstantInput, options?: Options) => Instance;
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
  /** Decimal places for derived unit values (default: 1). */
  round?: number;
};

/** Fixed-unit conversions with optional rounding; these do not validate duration amounts. */
export type To = {
  readonly sec: (msec: t.Msecs, round?: number) => t.Secs;
  readonly min: (msec: t.Msecs, round?: number) => t.Mins;
  readonly hour: (msec: t.Msecs, round?: number) => t.Hours;
  readonly day: (msec: t.Msecs, round?: number) => t.Days;
};

/**
 * A non-negative duration, or an invalid value with `ok: false` and -1 in every numeric field.
 * Invalid values format as '-1ms' by default; explicit units still convert and round that sentinel.
 */
export type Instance = t.TimeDuration;
