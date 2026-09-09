import { isAbsolute as absolute, relative } from '@std/path';
import { Is, type t } from '../common.ts';
import { relativePosix } from './rel.ts';

export const within: t.Path.Is.Lib['within'] = (root, candidate) => {
  if (!Is.string(root) || !Is.string(candidate)) return false;
  if (!absolute(root) || !absolute(candidate)) return false;

  const rel = relative(root, candidate);
  if (rel === '') return true;
  // Keep this guard: Windows can return absolute values here for cross-drive/absolute paths.
  if (absolute(rel)) return false;

  return relativePosix(rel).split('/')[0] !== '..';
};
