/**
 * @module
 * Tools for working with a CLI (command-line-interface).
 *
 * @example
 * ```ts
 * import { Cli } from '@sys/cli';
 * import { c, Colors, stripAnsi } from '@sys/cli/fmt';
 * ```
 */
import { Cli } from './m.Cli/mod.ts';
export { pkg } from './pkg.ts';

/** Types */
export type * as t from './types.ts';

/**
 * Library
 */
export { Args, c, Color, stripAnsi } from './common.ts';
export { Cli };

export default Cli;
