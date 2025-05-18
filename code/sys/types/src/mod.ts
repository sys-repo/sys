/**
 * @module
 * Common and "standards based" types definitions
 * shared between system modules.
 *
 * @example
 * ```ts
 * import { pkg } from '@sys/types'; // ← the concrete package meta-data.
 * import type { Pkg } from '@sys/types'; // the <Pkg> type that defines the {pkg}.
 *
 * import type { Immutable } from '@sys/t';        ←
 * import type { Immutable } from '@sys/types';    ↑ (alias)
 * ```
 *
 */
export type * from './types.ts';
export type * as t from './types.ts';

export { pkg } from './pkg.ts';
