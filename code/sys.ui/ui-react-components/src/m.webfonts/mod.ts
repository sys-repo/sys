/**
 * @module
 * Index of commonly reused web-font bundles.
 */
import type { t } from './common.ts';
import { ETBook } from './u.family.et-book.ts';
import { useFont } from './u.hook.ts';

export { ETBook };
export const WebFonts: t.WebFonts.Lib = {
  useFont,
  ETBook,
};
