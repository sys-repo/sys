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
  readonly kind: 'Crdt:Browser';
  readonly Is: t.CrdtIsLib;
  repo(args?: CrdtBrowserRepoArgs): t.CrdtRepo;
};

/** Arguments for browser `Crdt.repo` method. */
export type CrdtBrowserRepoArgs = {
  storage?: StorageArg;
  network?: NetworkArg | NetworkArg[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

type NetworkArg = NetworkAdapterInterface | 'BroadcastChannel' | { wss: t.StringUrl };
type StorageArg = StorageAdapterInterface | 'IndexedDb';
