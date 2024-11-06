import type { t } from './common.ts';

/**
 * Tools for working with, listening to, and
 * interacting with an Obsidian "vault"
 */
export type VaultLib = {
  dir(path: t.StringPath): Promise<VaultDir>;
};

/**
 * A filesystem directory where Obsidian
 * stores a single "Vault".
 */
export type VaultDir = {
  readonly path: string;
  readonly exists: boolean;
  listen(options?: t.VaultDirListenOptions): Promise<t.FsWatcher>;
};

/** Options passed to VaultDir.listen */
export type VaultDirListenOptions = {
  log?: boolean;
};
