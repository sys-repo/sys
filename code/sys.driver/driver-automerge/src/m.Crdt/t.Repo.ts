import type { t } from './common.ts';
type O = Record<string, unknown>;

/**
 * A repository of CRDT documents:
 */
export type CrdtRepo = {
  readonly id: { readonly instance?: t.StringId; readonly peer: t.StringId };
  create<T extends O>(initial: T | (() => T)): t.CrdtRef<T>;
  get<T extends O>(id: t.StringId): Promise<CrdtRepoGetResponse<T>>;
};

/** Response from the `repo.get` method. */
export type CrdtRepoGetResponse<T extends O> = {
  readonly doc?: t.CrdtRef<T> | undefined;
  readonly error?: CrdtRepoError;
};

/**
 * Repo related errors.
 */
export type CrdtRepoErrorKind = 'NotFound' | 'UNKNOWN';
export type CrdtRepoError = t.StdError & { kind: t.CrdtRepoErrorKind };
