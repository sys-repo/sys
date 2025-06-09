import type { Patch as P, PatchSource } from '@automerge/automerge';
import type { DocumentId } from '@automerge/automerge-repo';
import type { t } from './common.ts';

type O = Record<string, unknown>;
type Id = DocumentId;
type RefProps = t.Lifecycle & { readonly id: Id };

export type CrdtRef<T extends O> = t.ImmutableRef<T, P, CrdtEvents<T>> & RefProps;
export type CrdtChange<T extends O> = t.ImmutableChange<T, P> & { readonly source: PatchSource };
export type CrdtEvents<T extends O> = t.ImmutableEvents<T, P, CrdtChange<T>>;
export type CrdtPatch = P;

export type CrdtRepo = {
  create<T extends O>(initial: T): CrdtRef<T>;
  get<T extends O>(id: string): Promise<CrdtRef<T> | undefined>;
};

export type CrdtFsLib = {
  repo(): CrdtRepo;
};

export type CrdtIdbLib = {
  repo(): CrdtRepo;
};

