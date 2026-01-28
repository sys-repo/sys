/**
 * @module
 * Tools for working with a CLI (command-line-interface).
 *
 * @example
 * ```ts
 * import { Cli, Fmt, Table } from '@sys/cli';
 * import { c, Colors, stripAnsi } from '@sys/cli/fmt';
 * ```
 */
export { pkg } from './pkg.ts';

/** Types */
export type * as t from './types.ts';

/**
 * Library
 */
export * from './m.cli/mod.ts';
