/**
 * @module
 * Standard system libraries.
 *
 * @example
 * ```ts
 * import type * as t from 'jsr:@sys/std/t';                // ↓
 * import type { t } from 'jsr:@sys/std';                   // ↑ alternative.
 *
 * import { Async } from 'jsr:@sys/std';
 * import { Color, c } from 'jsr:@sys/std';
 * import { Dispose } from 'jsr:@sys/std';
 * import { Http } from 'jsr:@sys/std';
 * import { Path } from 'jsr:@sys/std';
 *
 * import { DateTime, Time } from 'jsr:@sys/std/date';
 * import { Immutable } from 'jsr:@sys/std/immutable';
 *
 * import { Testing } from 'jsr:@sys/std/testing';          // ↓
 * import { Testing } from 'jsr:@sys/std/testing/server';   // ↑ alternative.
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { Args } from './m.Args/mod.ts';
export { Async } from './m.Async/mod.ts';
export { COLORS, Color } from './m.Color/mod.ts';
export { D, Date, Duration, Time } from './m.DateTime/mod.ts';
export { Delete } from './m.Delete/mod.ts';
export { Dispose } from './m.Dispose/mod.ts';
export { Err } from './m.Err/mod.ts';
export { Fetch, Http } from './m.Http/mod.ts';
export { Id, cuid, slug } from './m.Id/mod.ts';
export { Immutable } from './m.Immutable/mod.ts';
export { IndexedDb } from './m.IndexedDb/mod.ts';
export { Is } from './m.Is/mod.ts';
export { Json } from './m.Json/mod.ts';
export { ObjectPath } from './m.ObjectPath/mod.ts';
export { Path } from './m.Path/mod.ts';
export { Pkg } from './m.Pkg/mod.ts';
export { Promise, maybeWait } from './m.Promise/mod.ts';
export { Rx, rx } from './m.Rx/mod.ts';
export { Testing } from './m.Testing/mod.ts';
export { Array, Num, Str, Value, asArray, isObject } from './m.Value/mod.ts';

export { R } from './common.ts';
