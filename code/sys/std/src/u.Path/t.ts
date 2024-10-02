import type { t } from '../common.ts';
import type * as StdPath from '@std/path';

/**
 * Library: helpers for working with resource paths.
 */
export type PathLib = {
  /* Path type verification flags. */
  Is: PathIs;

  /* Joins a sequence of paths, then normalizes the resulting path. */
  join: typeof StdPath.join;

  /* Joins a sequence of globs, then normalizes the resulting glob. */
  joinGlobs: typeof StdPath.joinGlobs;

  /* Resolves path segments into a path. */
  resolve: typeof StdPath.resolve;

  asAbsolute: (path: t.StringPath) => string;

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

/**
 * Path type verification flags.
 */
export type PathIs = {
  /* Test whether the provided path is absolute. */
  absolute: typeof StdPath.isAbsolute;

  /* Test whether the given string is a glob. */
  glob: typeof StdPath.isGlob;
};
