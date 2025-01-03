import type * as t from './t.ts';
import { exists } from './libs.ts';

/**
 * Determine if the given path points to a directory.
 */
export async function isDir(path: t.StringPath | URL) {
  try {
    if (!(await exists(path))) return false;
    return (await Deno.stat(path)).isDirectory;
  } catch (_error: any) {
    return false;
  }
}

/**
 * Determine if the given path points to a file (not a directory).
 */
export async function isFile(path: t.StringPath | URL) {
  try {
    if (!(await exists(path))) return false;
    return (await Deno.stat(path)).isFile;
  } catch (_error: any) {
    return false;
  }
}
