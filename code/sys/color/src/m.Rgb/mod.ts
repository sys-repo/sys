/**
 * @module
 * Helper for working with RGBA color values.
 *
 * @example
 * ```ts
 * import { Color } from '@sys/color';
 * import { Color } from '@sys/color/rgb';
 *
 * const theme = Color.theme('Dark');
 * const myColor = Color.alpha(theme.fg, 0.3);
 * ```
 */
export { Color, COLORS } from './m.Color.ts';
export { Theme } from './m.Theme.ts';
