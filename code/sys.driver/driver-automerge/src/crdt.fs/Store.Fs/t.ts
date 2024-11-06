import type { t } from '../common.ts';

/**
 * Represents a CRDT store that has access to a file-system.
 */
export type FsStore = t.Store & {
  readonly dir: t.StringDir;
};
