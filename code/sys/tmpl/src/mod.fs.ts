/**
 * @module
 * Tools for working with file-templates that can be copied or updated to target projects.
 *
 * @example
 * ```ts
 * import { Tmpl } from '@sys/tmpl/fs';
 *
 * const tmpl = Tmpl.create('path/to/source/dir');
 * const res = await tmpl.copy('path/to/target/dir');
 * ```
 */
