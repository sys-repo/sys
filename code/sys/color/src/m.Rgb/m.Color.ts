export * from './u.const.ts';
export * from './u.format.ts';

import type { t } from './common.ts';
import { Theme } from './m.Theme.ts';
import { COLORS } from './u.const.ts';
import { alpha, darken, format, lighten, ruby } from './u.format.ts';

/**
 * Library: Helpers for working with colors.
 */
export const Color: t.ColorLib = {
  ...COLORS,
  Theme,
  theme: Theme.create,
  format,
  alpha,
  ruby,
  lighten,
  darken,
};
