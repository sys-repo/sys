import type * as StdFs from '@std/fs';
import type * as StdPath from '@std/path';

import type { WalkEntry } from '@std/fs';
import type { t } from './common.ts';

export type { WalkEntry };

/**
 * Library: helpers for working with the file-system.
 */
export type FsLib = {
  /* Helpers for working with resource paths. */
  readonly Path: t.PathLib;

  /* Joins a sequence of paths, then normalizes the resulting path. */
  readonly join: typeof StdPath.join;

  /* Resolves path segments into a path. */
  readonly resolve: typeof StdPath.resolve;

  /* Factory for a glob helper. */
  readonly glob: t.GlobFactory;

  /* Asynchronously test whether or not the given path exists by checking with the file system. */
  readonly exists: typeof StdFs.exists;

  /* Asynchronously ensures that the directory exists, like `mkdir -p.` */
  readonly ensureDir: typeof StdFs.ensureDir;

  /* Copy all files in a directory. */
  readonly copyDir: t.CopyDir;

  /* Delete a directory (and it's contents). */
  readonly removeDir: t.RemoveDir;

  /* Asynchronously reads and returns the entire contents of a file as strongly-type JSON. */
  readonly readJson: t.ReadJson;

  /* Recursively walks through a directory and yields information about each file and directory encountered. */
  readonly walk: typeof StdFs.walk;

  /* Recursively walk up a directory tree (visitor pattern). */
  readonly walkUp: t.FsWalkUp;
};

/**
 * Generate a Glob helper scoped to a path.
 */
export type GlobFactory = (...dir: (t.StringPath | undefined)[]) => t.Glob;

/**
 * Runs globs against a filesystem root.
 */
export type Glob = {
  /**
   * Read out the base directory.
   */
  readonly base: string;

  /**
   *  Query the given glob pattern.
   */
  find(pattern: string, options?: { exclude?: string[] }): Promise<WalkEntry[]>;

  /**
   * Retrieve a sub-directory [Glob] from the current context.
   */
  dir(...subdir: (string | undefined)[]): Glob;
};

/**
 * Copy all files in a directory.
 */
export type CopyDir = (sourceDir: string, targetDir: string) => Promise<void>;

/**
 * Delete a directory (and it's contents).
 */
export type RemoveDir = (path: string, options?: { dry?: boolean; log?: boolean }) => Promise<void>;

/**
 * Asynchronously reads and returns the entire contents of a file as strongly-type JSON.
 */
export type ReadJson = <T>(path: string) => Promise<ReadJsonResponse<T>>;
export type ReadJsonResponse<T> = {
  readonly ok: boolean;
  readonly exists: boolean;
  readonly path: string;
  readonly json?: T;
  readonly error?: Error;
  readonly errorReason?: 'NotFound' | 'ParseError' | 'Unknown';
};

/**
 * Recursively walk up a directory tree (visitor pattern).
 */
export type FsWalkUp = (startAt: t.StringPath, onVisit: t.FsWalkUpallback) => Promise<void>;
export type FsWalkUpallback = (e: FsWalkUpCallbackArgs) => FsWalkUpallbackResponse;
export type FsWalkUpallbackResponse = Promise<t.IgnoredResponse> | t.IgnoredResponse;
export type FsWalkUpCallbackArgs = {
  dir: t.StringDirPath;
  files(): Promise<FsWalkFile[]>;
  stop(): void;
};

export type FsWalkFile = {
  path: t.StringPath;
  dir: t.StringDirPath;
  name: string;
  isSymlink: boolean;
};
