import type { t } from './common.ts';
export type * from './t.events.ts';

type O = Record<string, unknown>;

/** Options passed to the `Repo.get` method. */
export type CrdtRepoGetOptions = { timeout?: t.Msecs };

/** A loose late-bound input the resolves to a repo. */
export type CrdtRepoInput = t.Crdt.Repo | undefined | CrdtGetRepoInput;
export type CrdtGetRepoInput = () => t.Crdt.Repo | undefined;

/**
 * A repository of CRDT documents:
 */
export type CrdtRepo = t.LifecycleAsync &
  CrdtRepoMethods &
  CrdtRepoProps & {
    readonly sync: CrdtRepoProps['sync'] & { enable(enabled?: boolean): void };
  };

/** Pure event properties of the CRDT repo. */
export type CrdtRepoProps = {
  readonly status: t.CrdtRepoStatus;

  /** Opaque identifier string's for uniqueness only; format is not a semantic contract. */
  readonly id: {
    readonly instance: t.StringId;
    readonly peer: t.StringId;
  };
  readonly stores: readonly t.CrdtRepoStoreInfo[];
  readonly sync: {
    readonly peers: readonly t.PeerId[];
    readonly urls: readonly t.StringUrl[];
    readonly enabled: boolean | null;
  };
};

/**
 * Repo status/health summary.
 */
export type CrdtRepoStatus = {
  readonly ready: boolean;
  readonly stalled: boolean;
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
  create<T extends O>(initial: T | (() => T)): Promise<CrdtRefResult<T>>;
  get<T extends O>(id: t.StringId, options?: CrdtRepoGetOptions): Promise<CrdtRefResult<T>>;
  delete(id: t.StringId | t.Crdt.Ref): Promise<void>;
  events(until?: t.UntilInput): t.CrdtRepoEvents;
};

/** Response from methods retrieveing doc/ref handles. */
export type CrdtRefResult<T extends O> = CrdtRefOk<T> | CrdtRefFail;
export type CrdtRefOk<T extends O> = {
  readonly ok: true;
  readonly doc: t.CrdtRef<T>;
  readonly error?: undefined;
};
export type CrdtRefFail = {
  readonly ok: false;
  readonly doc?: undefined;
  readonly error: t.CrdtRepoError;
};

/** Repo related errors. */
export type CrdtRepoErrorKind = 'NotFound' | 'Timeout' | 'Worker' | 'UNKNOWN';
/** A standard Repo error. */
export type CrdtRepoError = t.StdError & { kind: t.CrdtRepoErrorKind };
