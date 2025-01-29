import type { t } from './common.ts';

/**
 * Testing helpers for working on a known server (eg. HTTP/network and file-system).
 */
export type TestingServerLib = t.TestingHttpLib & {
  /** Generates a new test directory on the file-system. */
  dir(dirname: string, options?: t.TestingDirOptions): t.TestingDir;
};

/** Options passed to the `Testing.dir` method. */
export type TestingDirOptions = {
  /** Flag indicating if the directory should be made "unique" with a generated slug. */
  slug?: boolean;
};

/**
 * A sample directory to test operations on the file-system.
 */
export type TestingDir = {
  /** The path to the test directory. */
  readonly dir: t.StringAbsoluteDir;

  /** Ensures the test directory exists. */
  create(): Promise<TestingDir>;

  /** Checks if the root directory, or a sub-path within it, exists. */
  exists(...path: t.StringPath[]): Promise<boolean>;

  /** Joins a path to the root test directory. */
  join(...parts: t.StringPath[]): t.StringAbsolutePath;

  /** Lists all paths within the root directory. */
  ls(trimRoot?: boolean): Promise<t.StringPath[]>;
};
