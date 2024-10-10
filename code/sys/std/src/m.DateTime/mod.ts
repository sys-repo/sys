/**
 * @module
 * Module: Tools for working with Date's and Time.
 *
 * @example
 * ```ts
 * import { Date, D, Time, Format } from '@sys/std/datetime';
 * ```
 *
 * The date helpers are within a structured named `Date` which if
 * you import it will replace the native JS `Date` object.
 * If you don't wish to do that import the `D` alias instead.
 *
 * ```ts
 * import { D, Date, Time } from '@sys/std/datetime';
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
export { Date, Date as D, Day, Format } from './m.Date.ts';
export { Duration } from './m.Time.u.Duration.ts';
export { Time } from './m.Time.ts';
