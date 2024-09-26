import type { WalkEntry } from '@std/fs';

/**
 * Runs globs against a filesystem root.
 */
export type Glob = {
  /**
   *  Query the given glob pattern.
   */
  find(pattern: string, options?: { exclude?: string[] }): Promise<WalkEntry[]>;

  /**
   * Retrieve a sub-directory [Glob] from the current context.
   */
  dir(...subdir: (string | undefined)[]): Glob;
};
