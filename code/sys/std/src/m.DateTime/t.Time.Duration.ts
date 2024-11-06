import type { t } from './common.ts';

/**
 * Library: tools for working with an elapsed duration of time.
 */
export type TimeDurationLib = {
  /** Time duration conversions. */
  readonly To: t.TimeDurationTo;

  /** Create a new TimeDuration */
  create(duration: string | number, options?: t.TimeDurationOptions): t.TimeDuration;

  /** Parses a string or a number (eg. "3.5h") into a Duration helper. */
  parse(input: string | number, options?: t.TimeDurationOptions): t.TimeDuration;

  /** Format milliseconds to a display string. */
  format(msec: t.Msecs, unit: t.TimeUnit, round?: number): string;
};

/** Options passed to a TimeDuration generator function. */
export type TimeDurationOptions = {
  /** Number of decimal places to round to. */
  round?: number;
};

/** Time duration conversions. */
export type TimeDurationTo = {
  sec(msec: t.Msecs, round?: number): t.Secs;
  min(msec: t.Msecs, round?: number): t.Secs;
  hour(msec: t.Msecs, round?: number): t.Secs;
  day(msec: t.Msecs, round?: number): t.Secs;
};
