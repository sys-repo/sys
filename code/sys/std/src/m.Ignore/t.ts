import type { t } from './common.ts';

/** A string that repersents an ignore glob file-matching pattern (allows for ! negation). */
export type StringGlobIgnore = string;

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
  /** List of ignore file-pattern rules. */
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
