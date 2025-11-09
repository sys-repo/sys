/**
 * CRDT types (abstract, implementation-agnostic).
 *
 *     import type { Crdt } from '@sys/crdt/t';
 */
import type { Rfc6902PatchOperation } from '@sys/std/t';
import type {
  CrdtChange as _Change,
  CrdtEvents as _Events,
  CrdtPathEvents as _PathEvents,
  CrdtDeleted,
  CrdtRef,
} from './t.m.Ref.ts';

type O = Record<string, unknown>;

/**
 * CRDT namespace: exposes the generic surface.
 */
export namespace Crdt {
  /** Immutable CRDT document reference. */
  export type Ref<
    T extends O = O,
    P = Rfc6902PatchOperation,
    EX extends object = {},
    CX extends object = {},
  > = CrdtRef<T, P, EX, CX>;

  /** Change payload. */
  export type Change<T extends O = O, P = Rfc6902PatchOperation, CX extends object = {}> = _Change<
    T,
    P,
    CX
  >;

  /** Event surface. */
  export type Events<
    T extends O = O,
    P = Rfc6902PatchOperation,
    EX extends object = {},
    CX extends object = {},
  > = _Events<T, P, EX, CX>;

  /** Path-filtered event stream. */
  export type PathEvents<
    T extends O = O,
    P = Rfc6902PatchOperation,
    CX extends object = {},
  > = _PathEvents<T, P, CX>;

  /** Fired when a CRDT document is deleted. */
  export type Deleted = CrdtDeleted;
}
