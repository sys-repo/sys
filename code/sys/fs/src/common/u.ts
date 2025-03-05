import type * as t from './t.ts';
import { exists, StdPath } from './libs.ts';

/**
 * Determine if the given path points to a directory.
 */
export async function isDir(path: t.StringPath | URL) {
  try {
    path = wrangle.path(path);
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
    path = wrangle.path(path);
    if (!(await exists(path))) return false;
    return (await Deno.stat(path)).isFile;
  } catch (_error: any) {
    return false;
  }
}

/**
 * Checks whether a file is binary.
 * It reads up to 8KB of the file and looks for <null? bytes
 * and a high percentage of non-printable characters.
 */
export async function isBinary(path: t.StringPath | URL): Promise<boolean> {
  path = wrangle.path(path);
  if (!(await isFile(path))) return false;

  const data = await Deno.readFile(path);

  // Use a chunk size of 8KB (or the entire file if smaller).
  const chunkSize = 8192;
  const chunk = data.slice(0, Math.min(data.length, chunkSize));

  // Check for a null byte.
  if (chunk.includes(0)) {
    return true;
  }

  // Count non-printable characters (excluding common whitespace).
  let nonPrintableCount = 0;
  for (const byte of chunk) {
    // Accept common control chars: tab (9), newline (10), and carriage return (13).
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      nonPrintableCount++;
    }
  }

  // If more than 30% of the bytes are non-printable, assume it's binary.
  if (nonPrintableCount / chunk.length > 0.3) {
    return true;
  }

  return false;
}

/**
 * Helpers
 */
const wrangle = {
  path(path: string | URL) {
    return typeof path === 'string' ? StdPath.resolve(path) : path;
  },
} as const;
