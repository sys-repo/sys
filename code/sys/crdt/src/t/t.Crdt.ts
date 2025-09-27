/**
 * CRDT types (abstract, implementation-agnostic).
 *
 *     import type { Crdt } from '@sys/crdt/t';
 */
import type { PatchOperation } from '@sys/std/t';
import type {
  //
  CrdtRef,
  CrdtChange as _Change,
  CrdtEvents as _Events,
} from './t.Crdt.Ref.ts';

type O = Record<string, unknown>;

/** CRDT namespace: exposes the generic surface. */
export namespace Crdt {
  /** Immutable CRDT document reference. */
  export type Ref<
    T extends O = O,
    P = PatchOperation,
    EX extends object = {},
    CX extends object = {},
  > = CrdtRef<T, P, EX, CX>;

  /** Change payload. */
  export type Change<T extends O = O, P = PatchOperation, CX extends object = {}> = _Change<
    T,
    P,
    CX
  >;

  /** Event surface. */
  export type Events<
    T extends O = O,
    P = PatchOperation,
    EX extends object = {},
    CX extends object = {},
  > = _Events<T, P, EX, CX>;
}
