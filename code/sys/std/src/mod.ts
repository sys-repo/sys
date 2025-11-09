/**
 * Standard system libraries.
 * @module
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { Args } from './m.Args/mod.ts';
export { Delete } from './m.Delete/mod.ts';
export { Dispose } from './m.Dispose/mod.ts';
export { Err, Try } from './m.Err/mod.ts';
export { Fn } from './m.Fn/mod.ts';
export { History } from './m.History/mod.ts';
export { Is } from './m.Is/mod.ts';
export { Json } from './m.Json/mod.ts';
export { Log } from './m.Log/mod.ts';
export { Path } from './m.Path/mod.ts';
export { Pkg } from './m.Pkg/mod.ts';
export { slug } from './m.Random/mod.ts';
export { Regex } from './m.Regex/mod.ts';
export { Signal } from './m.Signal/mod.ts';
export { Timecode } from './m.Time.Code/mod.ts';
export { Date } from './m.Time.Date/mod.ts';
export { Duration, Time, Timestamp } from './m.Time/mod.ts';
export { JsrUrl } from './m.Url.Jsr/mod.ts';
export { Url } from './m.Url/mod.ts';

export { Arr, Num, Obj, R, Str, asArray, isEmptyRecord, isObject, isRecord } from './-value.ts';
