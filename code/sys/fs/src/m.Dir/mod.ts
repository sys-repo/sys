/**
 * @module
 * Helpers for working with file-system directories.
 *
 * @example
 * ```ts
 * import { Dir } from '@sys/fs';
 *
 * const source = './path/to/input-dir';
 * const target = './path/to/output-dir';
 *
 * const snapshot = await Dir.snapshot({ source, target });
 * console.log(snapshot);
 * ```
 */
export { Dir } from './m.Dir.ts';
