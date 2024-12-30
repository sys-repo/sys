/**
 * @module
 * Tools for working with the file-system.
 *
 * @example
 * ```ts
 * import { Fs, Path } from '@sys/fs';
 * ```
 */
export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';

export { Fs } from './m.Fs/mod.ts';
export { Path } from './m.Path/mod.ts';
