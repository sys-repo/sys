export * from './u.const.ts';
export * from './u.format.ts';
export * from './u.theme.ts';

import type { t } from './common.ts';
import { COLORS } from './u.const.ts';
import { alpha, darken, format, lighten } from './u.format.ts';
import { theme } from './u.theme.ts';

/**
 * Library: Helpers for working with colors.
 */
export const Color: t.ColorLib = {
  ...COLORS,
  theme,
  format,
  alpha,
  lighten,
  darken,
};
