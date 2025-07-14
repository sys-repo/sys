import type { t } from './common.ts';

type O = Record<string, unknown>;
/** Options passed to the `Repo.get` method. */
export type CrdtRepoGetOptions = { timeout?: t.Msecs };

/**
 * A repository of CRDT documents:
 */
export type CrdtRepo = CrdtRepoMethods & CrdtRepoProps;

/** The properties of a CRDT Repo. */
export type CrdtRepoProps = {
  readonly id: { readonly instance: t.StringId; readonly peer: t.StringId };
  readonly sync: {
    enabled: boolean;
    readonly urls: t.StringUrl[];
  };
};
/** The methods of a CRDT Repo. */
export type CrdtRepoMethods = {
  create<T extends O>(initial: T | (() => T)): t.CrdtRef<T>;
  get<T extends O>(id: t.StringId, options?: CrdtRepoGetOptions): Promise<CrdtRefGetResponse<T>>;
  delete(id: t.StringId | t.Crdt.Ref): Promise<void>;
  events(dispose?: t.UntilInput): t.CrdtRepoEvents;
};

/** Response from the `repo.get` method. */
export type CrdtRefGetResponse<T extends O> = {
  readonly doc?: t.CrdtRef<T> | undefined;
  readonly error?: CrdtRepoError;
};

/** Repo related errors. */
export type CrdtRepoErrorKind = 'NotFound' | 'Timeout' | 'UNKNOWN';
/** A standard Repo error. */
export type CrdtRepoError = t.StdError & { kind: t.CrdtRepoErrorKind };

/**
 * Event emitter for a repo.
 */
export type CrdtRepoEvents = t.Lifecycle & {
  /** Primary change event stream. */
  readonly $: t.Observable<CrdtRepoChange>;
};

/** Represents a change to the repo state. */
export type CrdtRepoChange = {
  readonly before: CrdtRepoProps;
  readonly after: CrdtRepoProps;
};
