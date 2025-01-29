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
  readonly dir: string;
  ensure(): Promise<TestingDir>;
  exists(...path: t.StringPath[]): Promise<boolean>;
  join(...parts: t.StringPath[]): t.StringAbsolutePath;
  ls(trimRoot?: boolean): Promise<t.StringPath[]>;
};
