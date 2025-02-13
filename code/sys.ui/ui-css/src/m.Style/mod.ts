/**
 * @module
 * Tools for working with Styles/CSS programatically (aka "css-in-js").
 *
 * @example
 * ```ts
 * import { Style, Color, Edges } from '@sys/ui-css';
 * ```
 */
import { transform } from './u.transform.ts';

export { Style } from './m.Style.ts';
export { transform };
export const css = transform;
