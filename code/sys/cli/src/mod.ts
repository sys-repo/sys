/**
 * @module
 * Tools for working with command-line interfaces.
 *
 * @example
 * ```ts
 * import { Cli, Fmt, Table } from '@sys/cli';
 * import { c, Color, stripAnsi } from '@sys/cli/fmt';
 * ```
 */
export { pkg } from './pkg.ts';

/** Package type surface. */
export type * as t from './types.ts';

/**
 * Root CLI helper library.
 */
export * from './m.core/mod.ts';
