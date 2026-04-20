/**
 * @module
 * Standard system library.
 */
export { pkg } from '../pkg.ts';

/**
 * Types:
 */
export type * as t from '@sys/types/t';

/**
 * Libraries:
 */
export { Schedule } from '../m.Async.Schedule/mod.ts';
export { Dispose } from '../m.Dispose/mod.ts';
export { Try } from '../m.Try/mod.ts';
export { Fn } from '../m.Fn/mod.ts';
export { History } from '../m.History/mod.ts';
export { Lazy } from '../m.Lazy/mod.ts';
export { Log } from '../m.Log/mod.ts';
export { Regex } from '../m.Regex/mod.ts';

/** Root compatibility exports */
export { Err } from './-err.ts';
export { Is } from './-is.ts';
export { Pkg } from './-pkg.ts';
export { Date, Duration, Time } from './-time.ts';
export { Timecode } from './-time.timecode.ts';

/** Value utilities */
export { Arr, asArray, isEmptyRecord, isObject, isRecord, Num, Obj, Str } from './-value.ts';
