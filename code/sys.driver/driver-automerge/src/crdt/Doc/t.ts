import type { t } from './common.ts';
export type * from './t.Events.ts';

type O = Record<string, unknown>;
type P = t.Patch;
type Init<T> = t.ImmutableMutator<T>;

/**
 * An immutable/observable CRDT document reference.
 */
export type Doc<T extends O = O> = t.ImmutableRef<T, P, t.DocEvents<T>> & {
  readonly uri: t.StringUri;
  readonly is: { readonly ready: boolean; readonly deleted: boolean };
  toObject(): T;
};

/**
 * A complete reference-handle to a CRDT document
 * including the underlying automerge-repo handle.
 *
 * NOTE:
 *    This is not returned directly by the getter functions
 *    so as to provide a consistent API without inconsistencies
 *    being exposed. A DocWithHandle<T> can be cast from a Doc<T>
 *    when (and only IF) you know what you're doing. Typically
 *    you shouldn't need to use this.
 */
export type DocWithHandle<T extends O = O> = t.Doc<T> & { readonly handle: t.DocHandle<T> };

/**
 * Generator function that produces a stongly-typed document
 * with a curried initial state.
 */
export type DocFactory<T extends O = O> = (uri?: t.StringUri) => Promise<t.Doc<T>>;

/**
 * Doc mapping (composite objects).
 */
export type DocMap<T extends O> = t.ImmutableMap<T, t.DocMapPatch>;
export type DocMapPatch = t.ImmutableMapPatch<P>;

/**
 * Document access exposed from a store/repo.
 */
export type DocStore = {
  exists(uri?: t.StringUri, options?: GetOptions): Promise<boolean>;
  get<T extends O>(uri?: t.StringUri, options?: GetOptions): Promise<t.Doc<T> | undefined>;
  getOrCreate<T extends O>(
    initial: Init<T> | Uint8Array,
    uri?: t.StringUri,
    options?: GetOptions,
  ): Promise<t.Doc<T>>;
  delete(uri?: t.StringUri, options?: GetOptions): Promise<boolean>;
  factory<T extends O>(initial: Init<T>): t.DocFactory<T>;
  toBinary<T extends O>(initOrDoc: t.ImmutableMutator<T> | t.Doc<T>): Uint8Array;
  fromBinary<T extends O>(binary: Uint8Array, options?: FromBinaryOptions | t.StringUri): t.Doc<T>;
};

type GetOptions = { timeout?: t.Msecs };
type FromBinaryOptions = { uri?: t.StringUri; dispose$?: t.UntilObservable };

/**
 * Common meta-data object that can decorate CRDT documents
 * on a hidden key, eg { .meta: {} }
 */
export type DocWithMeta = { '.meta': DocMeta };
export type DocMetaType = { name: string };
export type DocMeta = { type?: t.DocMetaType; ephemeral?: boolean };

/**
 * History
 */
export type DocHistory<T extends O = O> = {
  readonly total: number;
  readonly commits: DocHistoryCommit<T>[];
  readonly latest: DocHistoryCommit<T>;
  readonly genesis?: DocHistoryGenesis<T>;
  page(index: t.Index, limit: number, sort?: t.SortOrder): DocHistoryPage<T>;
};
export type DocHistoryGenesis<T extends O = O> = {
  readonly initial: DocHistoryCommit<T>;
  readonly elapsed: t.TimeDuration;
};

export type DocHistoryCommit<T extends O = O> = t.AutomergeState<T>;

export type DocHistoryListItem<T extends O = O> = {
  readonly index: t.Index;
  readonly commit: t.DocHistoryCommit<T>;
};

/**
 * A single page within the history.
 */
export type DocHistoryPage<T extends O = O> = {
  readonly scope: t.DocHistoryPageScope;
  readonly items: DocHistoryListItem<T>[];
  readonly commits: DocHistoryCommit<T>[];
};
export type DocHistoryPageScope = {
  readonly index: t.Index;
  readonly total: number;
  readonly limit: number;
  readonly order: t.SortOrder;
  readonly is: { readonly first: boolean; readonly last: boolean };
};
