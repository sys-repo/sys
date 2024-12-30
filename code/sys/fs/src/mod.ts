/**
 * @module
 * Tools for working with the file-system.
 *
 * @example
 * ```ts
 * import { Fs, Path } from '@sys/fs';
 * import { FileMap } from '@sys/fs/filemap';
 * ```
 */
import { Fs } from './m.Fs/mod.ts';
export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';

/**
 * Helpers.
 */
export { FileMap } from './m.FileMap/mod.ts';
export { Path } from './m.Path/mod.ts';

/**
 * Main Library.
 */
export { Fs };
export default Fs;
