/**
 * @module
 * Module: Tools for working with Date's and Time.
 *
 * @example
 * ```ts
 * import { Dates, Time, Format } from '@sys/std/datetime';
 * ```
 *
 * The date helpers are within a structured named `Dates` (plural).
 * This is so that by default the native JS `Date` object is not overwritten.
 *
 * If you have no need in your module for the native JS `Date`, then a singular
 * alias of `Dates` is provided for importing convenience:
 *
 * ```ts
 * import { Date } from '@sys/std/datetime';
 * ```
 *
 * @example
 * Elapsed time durations can be helped with:
 *
 * ```ts
 * const elapsed = Time.duration('3.5h');
 * expect(b.hour).to.eql(3.5);
 *
 * elapsed.toString();   //     ← "4h" NB: rounded up.
 * elapsed.toString('m');   //  ← "210m"
 * ```
 */
export { Dates as Date, Dates, Day, Format } from './m.Dates.ts';
export { Duration } from './m.Duration.ts';
export { Time } from './m.Time.ts';
