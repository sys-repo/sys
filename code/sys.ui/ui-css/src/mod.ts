/**
 * @module
 * Tools for working with Styles/CSS programatically (aka "css-in-js").
 *
 * @example
 * Core style helpers.
 * ```ts
 * import { css, Style, Color } from '@sys/ui-css';
 * ```

 * @example
 * React specific style imports
 * ```ts
 * import { css, Style, Color } from '@sys/ui-css/react';
 * ```

*/
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { Color, Edges, Style } from './m.Style/mod.ts';
