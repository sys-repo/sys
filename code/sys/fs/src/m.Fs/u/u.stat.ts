import { Path, type t } from '../common.ts';

/**
 * Resolves to a Deno.FileInfo for the specified path.
 * Will always follow symlinks.
 */
export const stat: t.Fs.GetStat = async (path) => {
  try {
    path = typeof path === 'string' ? Path.resolve(path) : path;
    return await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
};
