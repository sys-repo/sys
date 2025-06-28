import type {
  AutomergeUrl,
  NetworkAdapterInterface,
  SharePolicy,
  StorageAdapterInterface,
} from '@automerge/automerge-repo';
import type { t } from './common.ts';

type StringDatabaseName = string;
type StringWebsocketEndpoint = string;

/**
 * API for CRDT's on IndexedDB (browser):
 */
export type CrdtBrowserLib = {
  readonly kind: 'Crdt:Browser';
  readonly Is: t.CrdtIsLib;
  readonly Url: t.CrdtUrlLib;
  repo(args?: CrdtBrowserRepoArgs): t.CrdtRepo;
};

/** Arguments for browser `Crdt.repo` method. */
export type CrdtBrowserRepoArgs = {
  storage?: CrdtBrowserStorageArgInput;
  network?: CrdtBrowserNetworkArgInput | CrdtBrowserNetworkArgInput[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

/** Storage argument. */
export type CrdtBrowserStorageArg = 'IndexedDb' | { database?: StringDatabaseName } | boolean;
/** Looser input args taking specific CRDT args, and general storage interface types. */
export type CrdtBrowserStorageArgInput = CrdtBrowserStorageArg | StorageAdapterInterface;

/** Network connection argument. */
export type CrdtBrowserNetworkArg = { ws: StringWebsocketEndpoint };
/** Looser input args taking specific CRDT args, and general network interface types. */
export type CrdtBrowserNetworkArgInput = CrdtBrowserNetworkArg | NetworkAdapterInterface;
