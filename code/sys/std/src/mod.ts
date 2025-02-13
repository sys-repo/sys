/**
 * @module
 * Standard system libraries.
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { Args } from './m.Args/mod.ts';
export { Async } from './m.Async/mod.ts';
export { D, Date, Duration, Time } from './m.DateTime/mod.ts';
export { Delete } from './m.Delete/mod.ts';
export { Dispose } from './m.Dispose/mod.ts';
export { Err } from './m.Err/mod.ts';
export { Immutable } from './m.Immutable/mod.ts';
export { Is } from './m.Is/mod.ts';
export { Json } from './m.Json/mod.ts';
export { ObjectPath } from './m.ObjectPath/mod.ts';
export { Path } from './m.Path/mod.ts';
export { Pkg } from './m.Pkg/mod.ts';
export { maybeWait, Promise } from './m.Promise/mod.ts';
export { slug } from './m.Random/mod.ts';
export { Regex } from './m.Regex/mod.ts';
export { Rx, rx } from './m.Rx/mod.ts';
export { Url } from './m.Url/mod.ts';
export { Array, asArray, isObject, isRecord, Num, Str, Value } from './m.Value/mod.ts';

export { R, V } from './common.ts';
