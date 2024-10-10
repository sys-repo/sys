import type { t } from './common.ts';

/**
 * Represents an elapsed duration of time.
 */
export type Duration = {
  readonly ok: boolean;
  readonly msec: t.Msecs;
  readonly sec: t.Secs;
  readonly min: t.Mins;
  readonly hour: t.Hours;
  readonly day: t.Days;
  toString(unit?: t.TimeUnit | { unit?: t.TimeUnit; round?: number }): string;
};

/**
 * Library: tools for working with an elapsed duration of time.
 */
export type DurationLib = {
  /* Create a new TimeDuration */
  create(duration: string | number, options?: t.DurationOptions): t.Duration;

  /* Parses a string or a number (eg. "3.5h") into a Duration helper. */
  parse(input: string | number, options?: t.DurationOptions): t.Duration;

  /* Format milliseconds to a display string. */
  format(msec: t.Msecs, unit: t.TimeUnit, round?: number): string;
};

/* Options passed to a TimeDuration generator function. */
export type DurationOptions = {
  /* Number of decimal places to round to. */
  round?: number;
};
