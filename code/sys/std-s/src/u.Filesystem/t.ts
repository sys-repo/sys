import type { t } from './common.ts';
import type { WalkEntry } from '@std/fs';

export type FsLib = {
  glob: t.GlobFactory;
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
