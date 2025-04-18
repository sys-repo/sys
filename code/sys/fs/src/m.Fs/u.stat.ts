import { type t, Path, exists } from './common.ts';

/**
 * Resolves to a Deno.FileInfo for the specified path.
 * Will always follow symlinks.
 */
export const stat: t.FsLib['stat'] = async (path: t.StringPath | URL) => {
  if (!(await exists(path))) return undefined;
  path = typeof path === 'string' ? Path.resolve(path) : path;
  return Deno.stat(path);
};
