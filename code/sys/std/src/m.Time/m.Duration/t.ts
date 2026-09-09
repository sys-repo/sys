import type { t } from './common.ts';

/** Tools for working with an elapsed duration of time. */
export type Lib = {
  /** Time duration conversions. */
  readonly To: To;

  /** Create a new duration helper. */
  create(duration: Input, options?: Options): Instance;

  /** Parses a string or a number (eg. "3.5h") into a duration helper. */
  parse(input: Input, options?: Options): Instance;

  /** Format milliseconds to a display string. */
  format(msec: t.Msecs, unit: t.TimeUnit, round?: number): string;

  /**
   * Time elapsed between two instants.
   * @param start earlier instant (ms or ISO string).
   * @param end later instant (default `Date.now()`).
   */
  elapsed(start: Input, end?: Input, options?: Options): Instance;
};

/** Input for time-duration helpers. */
export type Input = string | t.Msecs;

/** Options passed to a duration helper. */
export type Options = {
  /** Number of decimal places to round to. */
  round?: number;
};

/** Time duration conversions. */
export type To = {
  sec(msec: t.Msecs, round?: number): t.Secs;
  min(msec: t.Msecs, round?: number): t.Secs;
  hour(msec: t.Msecs, round?: number): t.Secs;
  day(msec: t.Msecs, round?: number): t.Secs;
};

/** Represents an elapsed duration of time. */
export type Instance = t.TimeDuration;
