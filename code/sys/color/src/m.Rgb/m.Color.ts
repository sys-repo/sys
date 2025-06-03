import type { ColorLib } from './t.ts';

export * from './u.const.ts';
export * from './u.format.ts';

import { Theme } from './m.Theme.ts';
import { COLORS } from './u.const.ts';
import { alpha, darken, format, lighten, ruby, toHex } from './u.format.ts';

/**
 * Library: Helpers for working with colors.
 */
export const Color: ColorLib = {
  ...COLORS,
  Theme,
  theme: Theme.create,
  format,
  alpha,
  ruby,
  lighten,
  darken,
  toHex,
};
