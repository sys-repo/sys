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
/** Type library (barrel file). */
export type * as t from './types.ts';

export { Color } from './common.ts';
export { Style, css } from './m.Style/mod.ts';
export { WebFont } from './m.WebFont/mod.ts';
