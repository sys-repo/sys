import type * as StdPath from '@std/path';
import type { t } from './common.ts';

/**
 * Tools for for working with string paths.
 * (addresses to resources locally or over a network)
 */
export type PathLib = {
  /** Path type verification flags. */
  Is: PathIsLib;

  /** Tools for formatting standard output (strings) within a CLI. */
  Format: t.PathFormatLib;

  /** Granular, platform specific, path joining tools. */
  Join: t.PathJoinLib;

  /** Joins a sequence of paths, then normalizes the resulting path. */
  join: typeof StdPath.join;

  /** Joins a sequence of globs, then normalizes the resulting glob. */
  joinGlobs: typeof StdPath.joinGlobs;

  /** Resolves path segments into a path. */
  resolve: typeof StdPath.resolve;

  /** Ensure the given path is absolute. */
  absolute: (path: t.StringPath) => string;

  /** Return the relative path based on current working directory. */
  relative: typeof StdPath.relative;

  /** Normalize the path, resolving '..' and '.' segments. */
  normalize: typeof StdPath.normalize;

  /** Converts a file URL to a path string. */
  fromFileUrl: typeof StdPath.fromFileUrl;

  /** Converts a path string to a file URL. */
  toFileUrl: typeof StdPath.toFileUrl;

  /** Return the directory path of a path. */
  dirname: typeof StdPath.dirname;

  /** Return the last portion of a path. */
  basename: typeof StdPath.basename;

  /** Return the extension of the path with leading period (".") */
  extname: typeof StdPath.extname;

  /** Create a helper for evaluating file-path extensions. */
  ext(...suffixes: string[]): PathFileExtension;

  /** Creates a directory path builder. */
  dir(base: t.StringDir, options?: PathDirOptions | PathJoinPlatform): PathDirBuilder;
};

/** Options passed to the `Path.dir` method. */
export type PathDirOptions = { platform?: PathJoinPlatform };

/**
 * Path verification flags.
 */
export type PathIsLib = {
  /** Determine if the provided path is absolute (not relative). */
  absolute: typeof StdPath.isAbsolute;

  /** Determine if the provided path is relative (not absolute). */
  relative(path: t.StringPath): boolean;

  /** Test whether the given string is a glob. */
  glob: typeof StdPath.isGlob;
};

/**
 * Helpers for joining and normalizing paths on multiple platforms.
 */
export type PathJoinLib = {
  /** Joins a sequence of paths an normalize result on Posix (forward-slash "/"). */
  readonly posix: PathJoiner;
  /** Joins a sequence of paths an normalize result on Windows (back-slash "/"). */
  readonly windows: PathJoiner;
  /** Detects the OS and joins/normalizes a sequence of paths with the correct divider character. */
  readonly auto: PathJoiner;
  /** Retrieve the appropriate path joiner based on platform. */
  platform(flag?: PathJoinPlatform): PathJoiner;
};

/** Flag used to specify the style of path joiner ("\" or "/"). */
export type PathJoinPlatform = 'auto' | 'posix' | 'windows';

/** A function that joins paths. */
export type PathJoiner = (...parts: string[]) => t.StringPath;

/**
 * Tools for formatting standard output (strings) within a CLI.
 */
export type PathFormatLib = {
  /** Path display formatting. */
  string(path: string, fmt?: PathFormatter): string;
};

/**
 * A style agnostic formatter function for converting a string path
 * into a "pretty" display element, eg. formatted to the console with colors.
 */
export type PathFormatter = (e: PathFormatterArgs) => t.IgnoredResult;
export type PathFormatterArgs = t.PathFormatterPart & {
  /**
   * Safely mutate the part to a new value.
   * @example
   * ```ts
   * e.change(c.green(e.text));
   * ```
   *
   */
  change(to: string): void;

  /**
   * Retrieve the current value of the "part"
   * (same as calling the `.text` property).
   */
  toString(): string;
};

/**
 * Represents a single "part" of a path as
 * split by the formatter.
 */
export type PathFormatterPart = {
  readonly index: t.Index;
  readonly kind: 'slash' | 'dirname' | 'basename';
  readonly text: string;
  readonly is: PathFormatterPartIs;
};

/**
 * Flags about a single "part" of a formatter path.
 */
export type PathFormatterPartIs = {
  readonly first: boolean;
  readonly last: boolean;
  readonly slash: boolean;
  readonly dirname: boolean;
  readonly basename: boolean;
};

/**
 * Helper for evaluating file-path extensions.
 */
export type PathFileExtension = {
  readonly suffixes: readonly string[];
  is(...path: t.StringPath[]): boolean;
};

/**
 * Builds paths from a root dir
 */
export type PathDirBuilder = {
  dir(path: string): PathDirBuilder;
  path(...parts: string[]): t.StringPath;
  toString(): t.StringDir;
};
