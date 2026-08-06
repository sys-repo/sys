import { isAbsolute as absolute, isGlob as glob } from '@std/path';
import type { t } from '../common.ts';
import { within } from '../u/within.ts';

/**
 * Path type verification flags.
 */
export const Is: t.Path.Is.Lib = {
  glob,
  within,
  absolute,
  relative: (path) => !Is.absolute(path),
};
