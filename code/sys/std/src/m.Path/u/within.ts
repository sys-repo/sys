import { isAbsolute as absolute, relative, SEPARATOR } from '@std/path';
import { Is, type t } from '../common.ts';

export const within: t.Path.Is.Lib['within'] = (root, candidate) => {
  if (!Is.string(root) || !Is.string(candidate)) return false;
  if (!absolute(root) || !absolute(candidate)) return false;

  const rel = relative(root, candidate);
  if (rel === '') return true;
  // Keep this guard: Windows can return absolute values here for cross-drive/absolute paths.
  if (absolute(rel)) return false;

  // A backslash is a filename character on POSIX, not a portable path separator.
  return rel.split(SEPARATOR)[0] !== '..';
};
