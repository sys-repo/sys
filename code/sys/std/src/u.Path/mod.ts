import { basename, dirname, fromFileUrl, join, relative, resolve, toFileUrl } from '@std/path';

/**
 * Path manipulation helpers.
 */
export const Path = {
  /* Joins a sequence of paths, then normalizes the resulting path. */
  join,

  /* Converts a file URL to a path string. */
  fromFileUrl,

  /* Converts a path string to a file URL. */
  toFileUrl,

  /* Resolves path segments into a path. */
  resolve,

  /* Return the relative path from from to to based on current working directory. */
  relative,

  /* Return the directory path of a path. */
  dirname,

  /* Return the last portion of a path. */
  basename,
} as const;
