/**
 * A number representing milliseconds.
 */
export type Msecs = number;

/**
 * Number represening seconds.
 */
export type Secs = number;

/**
 * Number represening minutes.
 */
export type Mins = number;

/**
 * Number represening hours.
 */
export type Hours = number;

/**
 * Number represening days.
 */
export type Days = number;

/**
 * Represents a Unix Epoch timestamp in seconds. The Unix Epoch time is
 * the number of seconds that have elapsed since January 1, 1970, 00:00:00 UTC.
 */
export type UnixEpoch = Secs;

/**
 * Represents a Unix timestamp in milliseconds. This offers higher precision
 * than UnixEpoch by including milliseconds since January 1, 1970, 00:00:00 UTC.
 */
export type UnixTimestamp = Msecs;

/**
 * The kind of unit of time a number represents.
 */
export type TimeUnit = 'msec' | 'ms' | 'sec' | 's' | 'min' | 'm' | 'hour' | 'h' | 'day' | 'd';

/**
 * Represents an elapsed duration of time.
 */
export type TimeDuration = {
  readonly ok: boolean;
  readonly msec: Msecs;
  readonly sec: Secs;
  readonly min: Mins;
  readonly hour: Hours;
  readonly day: Days;
  toString(unit?: TimeUnit | { unit?: TimeUnit; round?: number }): string;
};
