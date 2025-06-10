import type { Patch as P, PatchSource } from '@automerge/automerge';
import type { DocumentId } from '@automerge/automerge-repo';
import type { t } from './common.ts';

type O = Record<string, unknown>;
type Id = DocumentId;
type RefProps = t.Lifecycle & { readonly id: Id; readonly deleted: boolean };

/**
 * An immutable CRDT document reference:
 */
export type CrdtRef<T extends O> = t.ImmutableRef<T, P, CrdtEvents<T>> & RefProps;
/** Data thrown off when a CRDT document changes */
export type CrdtChange<T extends O> = t.ImmutableChange<T, P> & { readonly source: PatchSource };
/** Event interface for a CrdtRef. */
export type CrdtEvents<T extends O> = t.ImmutableEvents<T, P, CrdtChange<T>>;
/** A single change patch within a CRDT change. */
export type CrdtPatch = P;

/**
 * A repository of CRDT documents:
 */
export type CrdtRepo = {
  readonly id: { peer: string };
  create<T extends O>(initial: T): CrdtRef<T>;
  get<T extends O>(id: t.StringId): Promise<CrdtRef<T> | undefined>;
};

/**
 * Boolean flag evaluators:
 */
export type CrdtIsLib = {
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T>;
};
