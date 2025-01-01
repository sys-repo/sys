import type { t } from './common.ts';

/**
 * Helpers for working with file-system directories.
 */
export type FsDirLib = {
  /** Create a snapshot of the specified directory. */
  snapshot(source: t.StringDir, target: t.StringDir): Promise<DirSnapshot>;
};

/**
 * A backup snapshot
 */
export type DirSnapshot = {
  id: string;
  timestamp: number;
  path: { source: t.StringDir; target: t.StringDir };
  error?: t.StdError;
};
