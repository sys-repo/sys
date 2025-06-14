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
  storage?: CrdtBrowserStorageArg | boolean;
  network?: CrdtBrowserNetworkArg | CrdtBrowserNetworkArg[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

/** Storage argument. */
export type CrdtBrowserStorageArg = StorageAdapterInterface | 'IndexedDb';
/** Network argument. */
export type CrdtBrowserNetworkArg =
  | NetworkAdapterInterface
  | 'BroadcastChannel'
  | { ws: t.StringUrl };
