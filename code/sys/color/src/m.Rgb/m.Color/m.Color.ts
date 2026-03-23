import type { t } from '../common.ts';

import { COLORS } from './u.COLORS.ts';
import { Theme } from '../m.Theme/mod.ts';
import { alpha, darken, lighten, ruby, toGrayAlpha, toHex } from '../u.ts';

/**
 * Library: Helpers for working with colors.
 */
export const Color: t.ColorLib = {
  ...COLORS,
  Theme,
  theme: Theme.create,
  alpha,
  ruby,
  lighten,
  darken,
  toHex,
  toGrayAlpha,
};
