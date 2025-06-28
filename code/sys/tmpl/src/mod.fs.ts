/**
 * Tools for working with file-templates that can be copied or updated to target projects.
 * @module
 *
 * @example
 * ```ts
 * import { Tmpl, create } from '@sys/tmpl/fs';
 *
 * const tmpl = create('path/to/source/dir');
 * const res = await tmpl.copy('path/to/target/dir');
 * ```
 */
export { Fs, Path } from './common.ts';
export { create, Log, Tmpl } from './m.Tmpl/m.Tmpl.ts';
