import type { t } from '../common.ts';

/**
 * Tools for working with CRDT's in environments where a file-system is available.
 */
export type FsStoreLib = {
  init(args: t.FsStoreInitArgs): t.FsStore;

};

/** Arguments passed to `FsStore.init` */
export type FsStoreInitArgs = {
  dir: t.StringDir;
  dispose$?: t.UntilObservable;
  debug?: t.StoreDebug;
};

/**
 * Represents a CRDT store that has access to a native file-system.
 */
export type FsStore = t.Store & {
  readonly dir: t.StringDir;
};
