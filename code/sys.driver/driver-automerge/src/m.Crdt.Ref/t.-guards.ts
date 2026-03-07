import type { Crdt as G } from '@sys/crdt-t/t';
import type { t } from './common.ts';
import type { CrdtChange, CrdtEvents, CrdtPathEvents } from './t.ts';

type O = Record<string, unknown>;
type P = t.Automerge.Patch;
type CX = { readonly source: t.Automerge.PatchSource };
type EX<T extends O = O> = {
  readonly deleted$: t.Observable<t.CrdtDeleted>;
  path(
    path: t.ObjectPath | t.ObjectPath[],
    options?: t.ImmutablePathEventsOptions | boolean,
  ): CrdtPathEvents<T>;
};

/**
 * Compile-time drift guards:
 */

/** 1. CrdtEvents remains a pure extension of abstract ImmutableEvents + EX */
type _Guard_CrdtEvents<T extends O> = t.Type.Assert<
  t.Type.Equal<CrdtEvents<T>, t.ImmutableEvents<T, P, CrdtChange<T>> & EX<T>>
>;

/** 2. CrdtPathEvents equals the abstract specialization */
type _Guard_PathEvents<T extends O> = t.Type.Assert<
  t.Type.Equal<CrdtPathEvents<T>, G.PathEvents<T, P, CX>>
>;

/** 3. Path() signature matches canonical base */
type _Guard_PathSignature<T extends O> = EX<T>['path'] extends (
  path: t.ObjectPath | t.ObjectPath[],
  options?: t.ImmutablePathEventsOptions | boolean,
) => CrdtPathEvents<T>
  ? true
  : never;

/**
 * Force instantiation so TS actually checks:
 */
type _test_events = _Guard_CrdtEvents<{ readonly _: 1 }>;
type _test_paths = _Guard_PathEvents<{ readonly _: 1 }>;
type _test_sig = _Guard_PathSignature<{ readonly _: 1 }>;
