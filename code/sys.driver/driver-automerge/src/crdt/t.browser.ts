import type {
  AutomergeUrl,
  NetworkAdapterInterface,
  SharePolicy,
  StorageAdapterInterface,
} from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * API for CRDT's on IndexedDB (browser):
 */
export type CrdtBrowserLib = {
  readonly kind: 'Browser';
  readonly Is: t.CrdtIsLib;
  repo(args?: CrdtBrowserRepoArgs): Promise<t.CrdtRepo>;
};

/** Arguments for browser `Crdt.repo` method. */
export type CrdtBrowserRepoArgs = {
  storage?: StorageArg;
  network?: NetworkArg | NetworkArg[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

type NetworkArg = NetworkAdapterInterface | 'BroadcastChannel';
type StorageArg = StorageAdapterInterface | 'IndexedDb';
