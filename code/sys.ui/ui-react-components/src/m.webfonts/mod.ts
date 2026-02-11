/**
 * @module
 * Index of commonly reused web-font bundles.
 */
import type { t } from './common.ts';
import { ETBook } from './u.family.et-book.ts';
import { SourceSans3 } from './u.family.source-sans-3.ts';
export { useFontBundle } from './u.hook.ts';

export { ETBook };
export { SourceSans3 };
export const Fonts: t.Fonts.Lib = {
  ETBook,
  SourceSans3,
};
