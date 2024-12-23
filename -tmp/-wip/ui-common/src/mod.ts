/**
 * @module
 * Common system UI components.
 *
 * @example
 * ```ts
 * import { pkg } from '@sys/ui-common';
 *
 * // Common UI component requirements (.tsx)
 * import { Fc, Color, Style, css, rx } from '@sys/ui-common';
 *
 * // Common UI types.
 * import type { CssValue } from '@sys/ui-common/t';
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { COLORS, Color, FC, Style, css } from './common.ts';
