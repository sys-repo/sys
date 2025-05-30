import { isAbsolute as absolute, isGlob as glob } from '@std/path';
import type { t } from './common.ts';

/**
 * Path type verification flags.
 */
export const Is: t.PathIsLib = {
  glob,
  absolute,
  relative: (path) => !Is.absolute(path),
};
