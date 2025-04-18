export * from './u.const.ts';
export * from './u.format.ts';

import type { t } from './common.ts';
import { COLORS } from './u.const.ts';
import { alpha, darken, format, lighten } from './u.format.ts';
import { Theme } from './m.Theme.ts';

/**
 * Library: Helpers for working with colors.
 */
export const Color: t.ColorLib = {
  ...COLORS,
  Theme,
  theme: Theme.create,
  format,
  alpha,
  lighten,
  darken,
};
