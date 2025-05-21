import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { type t, Doc, Store, Symbols } from './common.ts';

type Init = {
  dir: t.StringDir;
  dispose$?: t.UntilObservable;
  debug?: t.StoreDebug;
};

/**
 * Tools for working with CRDT's in environments where a file-system is available.
 */
export const FsStore = {
  Doc,

  /**
   * Initialize a new instance of a CRDT store/repo.
   */
  init(args: Init) {
    const { dir, debug, dispose$ } = args;
    const storage = new NodeFSStorageAdapter(dir);
    const repo = new Repo({ storage });
    const base = Store.init({ repo, debug, dispose$ });
    const store: t.FsStore = {
      ...base,
      dir,
    };

    // Finish up.
    (store as any)[Symbols.kind] = Symbols.FsStore;
    return store;
  },
};
