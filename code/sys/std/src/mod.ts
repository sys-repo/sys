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
export { Args } from '@sys/std/args';
export { D, Date, Duration, Time, Timestamp } from '@sys/std/datetime';
export { Err, Try } from '@sys/std/error';
export { Log } from '@sys/std/log';
export { Path } from '@sys/std/path';
export { Pkg } from '@sys/std/pkg';
export { slug } from '@sys/std/random';
export { Signal } from '@sys/std/signal';
export { Url } from '@sys/std/url';
export { Delete } from './m.Delete/mod.ts';
export { Dispose } from './m.Dispose/mod.ts';
export { Fn } from './m.Fn/mod.ts';
export { History } from './m.History/mod.ts';
export { Is } from './m.Is/mod.ts';
export { Json } from './m.Json/mod.ts';
export { Regex } from './m.Regex/mod.ts';
export { JsrUrl } from './m.Url.Jsr/mod.ts';

export { Arr, Num, Obj, R, Str, asArray, isEmptyRecord, isObject, isRecord } from './-value.ts';
