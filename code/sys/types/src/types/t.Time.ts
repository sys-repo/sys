/* A number representing milliseconds. */
export type Msecs = number;

/* Number represening seconds. */
export type Secs = number;

/* Number represening minutes. */
export type Mins = number;

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
