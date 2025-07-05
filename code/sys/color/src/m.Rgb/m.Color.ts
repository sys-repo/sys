import type { ColorLib } from './t.ts';

export * from './m.Color.const.ts';
export * from './u.format.ts';

import { COLORS } from './m.Color.const.ts';
import { Theme } from './m.Theme.ts';
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
