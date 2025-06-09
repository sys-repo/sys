import type { Patch as P, PatchSource } from '@automerge/automerge';
import type {
  AutomergeUrl,
  DocumentId,
  NetworkAdapterInterface,
  SharePolicy,
} from '@automerge/automerge-repo';
import type { t } from './common.ts';

type O = Record<string, unknown>;
type Id = DocumentId;
type RefProps = t.Lifecycle & { readonly id: Id; readonly deleted: boolean };

type RepoArgs = {
  network?: NetworkAdapterInterface | NetworkAdapterInterface[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

/**
 * An immutable CRDT document reference.
 */
export type CrdtRef<T extends O> = t.ImmutableRef<T, P, CrdtEvents<T>> & RefProps;
/** Data thrown off when a CRDT document changes */
export type CrdtChange<T extends O> = t.ImmutableChange<T, P> & { readonly source: PatchSource };
/** Event interface for a CrdtRef. */
export type CrdtEvents<T extends O> = t.ImmutableEvents<T, P, CrdtChange<T>>;
/** A single change patch within a CRDT change. */
export type CrdtPatch = P;

/**
 * A repository of CRDT documents.
 */
export type CrdtRepo = {
  create<T extends O>(initial: T): CrdtRef<T>;
  get<T extends O>(id: t.StringId): Promise<CrdtRef<T> | undefined>;
};

/**
 * API for CRDT's on a file-system:
 */
export type CrdtLibFs = {
  readonly kind: 'FileSystem';
  readonly Is: CrdtIsLib;
  repo(args: t.StringDir | t.CrdtFsRepoArgs): CrdtRepo;
};
/** Arguments for file-system `Crdt.repo` method. */
export type CrdtFsRepoArgs = { dir: t.StringDir } & RepoArgs;

/**
 * API for CRDT's on IndexedDB (browser):
 */
export type CrdtLibIdb = {
  readonly kind: 'IndexedDb';
  readonly Is: CrdtIsLib;
  repo(args?: CrdtIdbRepoArgs): CrdtRepo;
};
/** Arguments for IndexedDb `Crdt.repo` method. */
export type CrdtIdbRepoArgs = RepoArgs;

/**
 * Boolean flag evaluators:
 */
export type CrdtIsLib = {
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T>;
};
