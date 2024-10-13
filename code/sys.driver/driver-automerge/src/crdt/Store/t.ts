import type { t } from './common.ts';

export type StoreNetworkKind = 'BroadcastChannel' | 'WebRTC' | 'Unknown';

/**
 * Store (a repository of documents).
 */
export type Store = t.Lifecycle & {
  readonly repo: t.AutomergeRepo;
  readonly doc: t.DocStore;
};

/**
 * Testing options used to debug a store.
 */
export type StoreDebug = { loadDelay?: t.Msecs | (() => t.Msecs) };
