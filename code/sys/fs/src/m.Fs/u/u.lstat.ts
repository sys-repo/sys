import { Path, type t } from '../common.ts';

/** Retrieve lstat information without following a final-path symlink. */
export const lstat: t.Fs.GetStat = async (path) => {
  try {
    path = typeof path === 'string' ? Path.resolve(path) : path;
    return await Deno.lstat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
};
