/**
 * @module
 * Helpers for working with file-system directories.
 *
 * @example
 * ```ts
 * import { Dir } from '@sys/fs';
 *
 * const hash = await Dir.Hash.compute('./path/to/input-dir');
 * console.log(hash.hash.digest);
 * ```
 */
export { Dir } from './m.Dir.ts';
