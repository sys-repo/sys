import type { t } from '../common.ts';
// The observation entry must not load the composed Fs/CLI dependency graph.
import { Is } from '@sys/std/is';
import { Path } from '@sys/std/path';

/**
 * Retrieve lstat information without following a final-path symlink.
 * Missing paths return undefined; other filesystem errors propagate.
 */
export const lstat: t.Fs.GetStat = async (path) => {
  try {
    path = Is.string(path) ? Path.resolve(path) : path;
    return await Deno.lstat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
};
