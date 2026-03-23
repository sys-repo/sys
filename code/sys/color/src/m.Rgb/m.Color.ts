import type { ColorLib } from './t.ts';

export * from './m.Color.const.ts';
export * from './u.format.ts';

import { COLORS } from './m.Color.const.ts';
import { Theme } from './m.Theme/mod.ts';
import { alpha, darken, lighten, ruby, toGrayAlpha, toHex } from './u.format.ts';

/**
 * Library: Helpers for working with colors.
 */
export const Color: ColorLib = {
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
