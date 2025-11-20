import type {
  AutomergeUrl,
  NetworkAdapterInterface,
  SharePolicy,
  StorageAdapterInterface,
} from '@automerge/automerge-repo';
import type { t } from './common.ts';

type StringDatabaseName = string;

/**
 * API for CRDT's on IndexedDB (browser):
 */
export type CrdtWebLib = t.CrdtLib & {
  readonly kind: 'crdt:web';
  repo(args?: CrdtWebRepoArgs): t.CrdtRepo;
};

/** Arguments for browser `Crdt.repo` method. */
export type CrdtWebRepoArgs = {
  storage?: CrdtWebStorageArgInput;
  network?: CrdtWebNetworkArgInput | CrdtWebNetworkArgInput[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
  until?: t.UntilInput;
};

/** Storage argument. */
export type CrdtWebStorageArg = 'IndexedDb' | { database?: StringDatabaseName } | boolean;
/** Looser input args taking specific CRDT args, and general storage interface types. */
export type CrdtWebStorageArgInput = CrdtWebStorageArg | StorageAdapterInterface;

/** Network connection argument. */
export type CrdtWebNetworkArg = t.CrdtWebsocketNetworkArg;
/** Looser input args taking specific CRDT args, and general network interface types. */
export type CrdtWebNetworkArgInput = CrdtWebNetworkArg | NetworkAdapterInterface | t.Falsy;
