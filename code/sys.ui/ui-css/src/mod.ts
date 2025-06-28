/**
 * Tools for working with Styles/CSS programatically (aka "css-in-js").
 * @module
 *
 * @example
 * Core style helpers.
 * ```ts
 * import { css, Style, Color } from '@sys/ui-css';
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { Color } from './common.ts';
export { css, Style } from './m.Style/mod.ts';
