/**
 * @module
 * Tools for working with the file-system.
 *
 * @example
 * ```ts
 * import { Fs, Path } from '@sys/fs';
 * import { FileMap } from '@sys/fs/filemap';
 * import { Watch } from '@sys/fs/watch';
 * ```
 */
import { Fs } from './m.Fs/mod.ts';
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

/**
 * Helpers.
 */
export { Dir } from './m.Dir/mod.ts';
export { FileMap } from './m.FileMap/mod.ts';
export { Path } from './m.Path/mod.ts';
export { Pkg } from './m.Pkg/mod.ts';
export { Watch } from './m.Watch/mod.ts';

/**
 * Main Library.
 */
export { Fs };
export default Fs;
