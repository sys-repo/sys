import type { t } from './common.ts';
export type * from './t.events.ts';

type O = Record<string, unknown>;

/** Options passed to the `Repo.get` method. */
export type CrdtRepoGetOptions = { timeout?: t.Msecs };

/**
 * A repository of CRDT documents:
 */
export type CrdtRepo = t.LifecycleAsync &
  CrdtRepoMethods &
  CrdtRepoProps & { readonly sync: CrdtRepoProps['sync'] & { enable(enabled?: boolean): void } };

/** Pure event properties of the CRDT repo. */
export type CrdtRepoProps = {
  readonly ready: boolean;
  readonly id: { readonly instance: t.StringId; readonly peer: t.StringId };
  readonly stores: readonly t.CrdtRepoStoreInfo[];
  readonly sync: {
    readonly peers: readonly t.PeerId[];
    readonly urls: readonly t.StringUrl[];
    readonly enabled: boolean | null;
  };
};

/** Info about a repository store. */
export type CrdtRepoStoreInfo = CrdtRepoStoreInfoFs | CrdtRepoStoreInfoIdb;
export type CrdtRepoStoreInfoFs = { kind: 'fs'; dir: t.StringDir };
export type CrdtRepoStoreInfoIdb = {
  kind: 'indexed-db';
  database: t.StringName;
  store: t.StringName;
};

/** The methods of a CRDT Repo. */
export type CrdtRepoMethods = {
  whenReady(): Promise<t.CrdtRepo>;
  create<T extends O>(initial: T | (() => T)): t.CrdtRef<T>;
  get<T extends O>(id: t.StringId, options?: CrdtRepoGetOptions): Promise<CrdtRefGetResponse<T>>;
  delete(id: t.StringId | t.Crdt.Ref): Promise<void>;
  events(until?: t.UntilInput): t.CrdtRepoEvents;
};

/** Response from the `repo.get` method. */
export type CrdtRefGetResponse<T extends O> = {
  readonly doc?: t.CrdtRef<T> | undefined;
  readonly error?: t.CrdtRepoError;
};

/** Repo related errors. */
export type CrdtRepoErrorKind = 'NotFound' | 'Timeout' | 'UNKNOWN';
/** A standard Repo error. */
export type CrdtRepoError = t.StdError & { kind: t.CrdtRepoErrorKind };
