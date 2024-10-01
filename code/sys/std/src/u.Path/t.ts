import type * as StdPath from '@std/path';

/**
 * Library: helpers for working with resource paths.
 */
export type PathLib = {
  /* Joins a sequence of paths, then normalizes the resulting path. */
  join: typeof StdPath.join;

  /* Joins a sequence of globs, then normalizes the resulting glob. */
  joinGlobs: typeof StdPath.joinGlobs;

  /* Resolves path segments into a path. */
  resolve: typeof StdPath.resolve;

  /* Return the relative path from from to to based on current working directory. */
  relative: typeof StdPath.relative;

  /* Converts a file URL to a path string. */
  fromFileUrl: typeof StdPath.fromFileUrl;

  /* Converts a path string to a file URL. */
  toFileUrl: typeof StdPath.toFileUrl;

  /* Return the directory path of a path. */
  dirname: typeof StdPath.dirname;

  /* Return the last portion of a path. */
  basename: typeof StdPath.basename;
};
