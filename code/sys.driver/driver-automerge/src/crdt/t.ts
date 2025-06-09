import type { Patch as P, PatchSource } from '@automerge/automerge';
import type { t } from './common.ts';

type O = Record<string, unknown>;

export type CrdtRef<T> = t.ImmutableRef<T, P, CrdtEvents<T>>;
export type CrdtChange<T> = t.ImmutableChange<T, P> & { readonly source: PatchSource };
export type CrdtEvents<T> = t.ImmutableEvents<T, P, CrdtChange<T>>;
export type CrdtPatch = P;

