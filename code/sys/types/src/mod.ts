/**
 * @module
 * Common and "standards based" types definitions
 * shared between system modules.
 *
 * @example
 * ```ts
 * import type { Pkg } from '@sys/types';
 *
 * import type { Immutable } from '@sys/t';        ←
 * import type { Immutable } from '@sys/types';    ↑ (alias)
 * ```
 *
 * To import the Pkg (Module/Package) concrete meta-data
 * info:
 *
 * ```ts
 * import { Pkg } from '@sys/types/pkg';
 * ```
 *
 */
export type * from './types/mod.ts';
export {};
