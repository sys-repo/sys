import type { AutomergeUrl, NetworkAdapterInterface, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

type RepoArgs = {
  network?: NetworkAdapterInterface | NetworkAdapterInterface[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

/**
 * API for CRDT's on a file-system:
 */
export type CrdtLibFs = {
  readonly kind: 'FileSystem';
  readonly Is: t.CrdtIsLib;
  repo(args: t.StringDir | t.CrdtFsRepoArgs): Promise<t.CrdtRepo>;
};
/** Arguments for file-system `Crdt.repo` method. */
export type CrdtFsRepoArgs = { dir: t.StringDir } & RepoArgs;

/**
 * API for CRDT's on IndexedDB (browser):
 */
export type CrdtLibIdb = {
  readonly kind: 'IndexedDb';
  readonly Is: t.CrdtIsLib;
  repo(args?: CrdtIdbRepoArgs): Promise<t.CrdtRepo>;
};
/** Arguments for IndexedDb `Crdt.repo` method. */
export type CrdtIdbRepoArgs = RepoArgs;
