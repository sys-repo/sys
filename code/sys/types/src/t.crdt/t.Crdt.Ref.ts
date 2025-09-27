import type { PatchOperation } from '@sys/std/t';
import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Default patch type for abstract CRDT refs.
 * Downstreams (e.g. Automerge) can supply their own P.
 */
type PDefault = PatchOperation;
type RefProps = t.Lifecycle & {
  readonly id: t.StringId;
  readonly deleted: boolean;
};

/**
 * A CRDT document reference (abstract, implementation-agnostic).
 *
 * T  = document value shape
 * P  = patch operation type (defaults to RFC JSON Patch)
 * EX = extra event members to merge into the event surface
 * CX = extra fields to merge into the change payload
 */
export type CrdtRef<
  T extends O = O,
  P = PDefault,
  EX extends object = {},
  CX extends object = {},
> = t.ImmutableRef<T, P, CrdtEvents<T, P, EX, CX>> & RefProps;

/** Data emitted when a CRDT document changes. */
export type CrdtChange<T extends O = O, P = PDefault, CX extends object = {}> = t.ImmutableChange<
  T,
  P
> &
  CX;

/** Event surface for a CRDT document reference. */
export type CrdtEvents<
  T extends O = O,
  P = PDefault,
  EX extends object = {},
  CX extends object = {},
> = t.ImmutableEvents<T, P, CrdtChange<T, P, CX>> & EX;

/** Options passed to path-filtered event helpers. */
export type CrdtPathEventsOptions = { exact?: boolean };

/** Path-filtered event stream (shape reusable by downstreams). */
export type CrdtPathEvents<T extends O = O, P = PDefault, CX extends object = {}> = {
  readonly $: t.Observable<CrdtChange<T, P, CX>>;
  readonly match: { readonly paths: t.ObjectPath[]; readonly exact: boolean };
};
