import type { t } from './common.ts';

/** A string that is a glob file-matching pattern.  */
export type StringGlob = string;

/** A string that repersents an ignore glob file-matching pattern (allows for ! negation). */
export type StringGlobIgnore = StringGlob;

/**
 * Helpers for performing glob searches over a file-system.
 */
export type GlobLib = {
  /** Generate a Glob helper scoped to a path. */
  readonly create: t.GlobFactory;

  /** List the file-paths within a directory (simple glob). */
  readonly ls: t.GlobPathList;

  /** Tools for working with ignore files (eg. ".gitignore"). */
  readonly Ignore: t.GlobIgnoreLib;

  /** Create an instance of an glob-ignore helpers (eg. from a `.gititnore` file). */
  readonly ignore: t.GlobIgnoreLib['create'];
};

/**
 * Generate a Glob helper scoped to a path.
 */
export type GlobFactory = (dir: t.StringDir, options?: GlobOptions) => t.Glob;

/**
 * Runs globs against a filesystem root.
 */
export type Glob = {
  /** Read out the base directory. */
  readonly base: t.StringDir;

  /** Query the given glob pattern. */
  find(pattern: string, options?: t.GlobOptions): Promise<t.WalkEntry[]>;

  /** Retrieve a sub-directory `Glob` from the current context. */
  dir(subdir: t.StringDir): Glob;
};

/** Options for a glob operation.  */
export type GlobOptions = {
  exclude?: string[];
  includeDirs?: boolean;
};

/**
 * List the file-paths within a directory (simple glob).
 */
export type GlobPathList = (dir: t.StringDir, options?: t.GlobOptions) => Promise<t.StringPath[]>;

/**
 * Tools for working with ignore files (eg. ".gitignore").
 */
export type GlobIgnoreLib = {
  /** Create an instance of an glob-ignore helpers (eg. from a `.gititnore` file).  */
  create(rules: t.StringGlobIgnore | t.StringGlobIgnore[]): GlobIgnore;
};

/**
 * A glob-ignore pattern matcher.
 */
export type GlobIgnore = {
  /** List of ignore rules. */
  rules: t.GlobIgnoreRule[];

  /**
   * Determine if a path is ignored by the rule-set.
   *
   * @param path the path (absolute or relative) to test.
   * @param root optional root directory for the repo - if provided,
   *        we will compute a relative path, which more closely mimics
   *        actual gitignore usage (patterns are usually relative to repo root).
   */
  isIgnored(path: t.StringPath, root?: t.StringDir): boolean;
};

/**
 * Represents a single glob-ignore rule.
 */
export type GlobIgnoreRule = {
  pattern: t.StringGlobIgnore;
  isNegation: boolean;
};
