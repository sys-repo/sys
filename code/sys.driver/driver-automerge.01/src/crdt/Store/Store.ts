import { Repo } from '@automerge/automerge-repo';

import { Doc } from '../mod.ts';
import { fromBinary, toBinary } from '../Doc/Doc.u.binary.ts';
import { StoreIndex as Index } from '../Store.Index/mod.ts';
import { Is, Symbols, Time, rx, type t } from './common.ts';

type O = Record<string, unknown>;
type GetOptions = { timeout?: t.Msecs };
type FromBinaryOptions = { uri?: t.StringUri; dispose$?: t.UntilObservable };
type InitOptions = { repo?: t.AutomergeRepo; dispose$?: t.UntilObservable; debug?: t.StoreDebug };

/**
 * Manage an Automerge repo.
 */
export const Store = {
  Doc,
  Index,
  index: Index.init,

  /**
   * Initialize a new instance of a CRDT repo.
   */
  init(options: InitOptions = {}) {
    const { debug } = options;
    const life = rx.lifecycle(options.dispose$);
    const { dispose$, dispose } = life;
    const repo = options.repo ?? new Repo({ network: [] });

    const doc: t.DocStore = {
      /**
       * Create an "initial constructor" factory for typed docs.
       */
      factory<T extends O>(initial: t.ImmutableMutator<T>) {
        return (uri?: t.StringUri) => api.doc.getOrCreate<T>(initial, uri);
      },

      /**
       * Determine if the given document exists within the repo.
       */
      async exists(uri?: t.StringUri, options: GetOptions = {}) {
        const res = await api.doc.get(uri, options);
        return !!res;
      },

      /**
       * Find or create a new CRDT document from the repo.
       */
      async getOrCreate<T extends O>(
        initial: t.ImmutableMutator<T> | Uint8Array,
        uri?: t.StringUri,
        options: GetOptions = {},
      ) {
        const { timeout } = options;
        await Debug.loadDelay(debug);
        return Doc.getOrCreate<T>({ repo, initial, uri, timeout, dispose$ });
      },

      /**
       * Find the existing CRDT document in the repo (or return nothing).
       */
      async get<T extends O>(uri?: t.StringUri, options: GetOptions = {}) {
        const { timeout } = options;
        await Debug.loadDelay(debug);
        return Is.automergeUrl(uri) ? Doc.get<T>({ repo, uri, timeout, dispose$ }) : undefined;
      },

      /**
       * Generate a new document from a stored binary.
       * NOTE: this uses the "hard coded byte array hack"
       */
      fromBinary<T extends O>(binary: Uint8Array, options: FromBinaryOptions | t.StringUri) {
        const { uri, dispose$ } = wrangle.fromBinaryOptions(options);
        return fromBinary<T>({
          repo,
          binary,
          uri,
          dispose$: rx.disposable([dispose$, life.dispose$]).dispose$,
        });
      },

      /**
       * Convert a document to a Uint8Array for storage.
       * See the "hard-coded byte array hack"
       * https://automerge.org/docs/cookbook/modeling-data/#setting-up-an-initial-document-structure
       */
      toBinary<T extends O>(initOrDoc: t.ImmutableMutator<T> | t.Doc<T>) {
        return toBinary<T>(initOrDoc);
      },

      /**
       * Delete the specified document.
       */
      delete(uri?: t.StringUri, options = {}) {
        const { timeout } = options;
        return Doc.delete({ repo, uri, timeout });
      },
    };

    const api: t.Store = {
      get doc() {
        return doc;
      },
      get repo() {
        return repo;
      },

      /**
       * Lifecycle
       */
      dispose,
      dispose$,
      get disposed() {
        return life.disposed;
      },
    };

    (api as any)[Symbols.kind] = Symbols.Store;
    return api;
  },

  /**
   * Retrieve handle
   */
  handle<T extends O>(input: t.Doc<T>) {
    const handle = (input as t.DocWithHandle<T>)?.handle;
    if (!Is.handle(handle)) throw new Error('input does not have a handle');
    return handle;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  fromBinaryOptions(options?: FromBinaryOptions | t.StringUri): FromBinaryOptions {
    if (typeof options === 'string') return { uri: options };
    if (typeof options === 'object') return options;
    return {};
  },

  loadDelay(debug?: t.StoreDebug) {
    if (!debug || !debug.loadDelay) return 0;
    return typeof debug.loadDelay === 'function' ? debug.loadDelay() : debug.loadDelay;
  },
} as const;

const Debug = {
  async loadDelay(debug?: t.StoreDebug) {
    const msecs = wrangle.loadDelay(debug);
    if (msecs > 0) await Time.wait(msecs);
  },
};
