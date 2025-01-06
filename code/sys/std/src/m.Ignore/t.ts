import type { t } from './common.ts';

/**
 * Tools for working with ignore files (eg. ".gitignore").
 */
export type IgnoreLib = {
  /** Create an instance of an glob-ignore helpers (eg. from a `.gititnore` file).  */
  create(rules: string | string[]): Ignore;
};

/**
 * A glob-ignore pattern matcher.
 */
export type Ignore = {
  /** List of ignore file-pattern rules. */
  rules: t.IgnoreRule[];

  /**
   * Determine if a path is ignored by the rule-set.
   *
   * @param path the path (absolute or relative) to test.
   * @param root optional root directory for the repo - if provided,
   *        we will compute a relative path, which more closely mimics
   *        actual gitignore usage (patterns are usually relative to repo root).
   */
  isIgnored(path: t.StringPath, root?: t.StringDir): boolean;

  /**
   * Debugs ignore rules and returns the checking result, which is
   * equivalent to git check-ignore -v.
   *
   * @param path the path (absolute or relative) to test.
   * @param root optional root directory for the repo - if provided,
   *        we will compute a relative path, which more closely mimics
   *        actual gitignore usage (patterns are usually relative to repo root).
   */
  check(path: t.StringPath, root?: t.StringDir): t.IgnoreCheckPathResult;
};

/**
 * Represents a single glob-ignore rule.
 */
export type IgnoreRule = {
  readonly pattern: string;
  readonly negative: boolean;
};

/**
 * Response from the `ignore.check(path)` method.
 */
export type IgnoreCheckPathResult = {
  readonly ignored: boolean;
  readonly unignored: boolean;
  readonly rule?: IgnoreRule;
};
