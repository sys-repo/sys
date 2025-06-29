import { isAbsolute as absolute, isGlob as glob } from '@std/path';
import type { PathIsLib } from './t.ts';

/**
 * Path type verification flags.
 */
export const Is: PathIsLib = {
  glob,
  absolute,
  relative: (path) => !Is.absolute(path),
};
