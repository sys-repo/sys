/**
 * @module
 * Helpers for working with cryptographic functions.
 *
 * @example
 * ```ts
 * // Context: universal (Browser + WinterTC)
 * import { pkg } from '@sys/crypto';
 * import { Hash } from '@sys/crypto/hash';
 *
 * // Context: file-system environments (WinterTC)
 * import { Hash } from '@sys/crypto/fs/hash';
 * import { Pkg, Dist } from '@sys/crypto/fs/pkg';
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';
