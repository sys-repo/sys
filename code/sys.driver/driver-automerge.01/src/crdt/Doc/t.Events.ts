import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.Patch;

/**
 * Event API
 */
export type DocEvents<T extends O = O> = t.ImmutableEvents<T, P, DocChanged<T>> & {
  readonly $: t.Observable<t.DocEvent<T>>;
  readonly deleted$: t.Observable<t.DocDeleted<T>>;
  readonly ephemeral: DocEventsEphemeral<T>;
};

/**
 * Ephemeral
 */
export type DocEventsEphemeral<T extends O> = {
  readonly out$: t.Observable<t.DocEphemeralOut<T>>;
  readonly in$: t.Observable<t.DocEphemeralIn<T>>;
  in<M extends t.CBOR>(filter?: DocEphemeralFilter<T, M>): DocEphemeralFilterMonad<T, M>;
};

export type DocEphemeralFilterMonad<T extends O, M extends t.CBOR> = {
  readonly $: t.Observable<t.DocEphemeralIn<T, M>>;
  filter(fn: DocEphemeralFilter<T, M>): DocEphemeralFilterMonad<T, M>;
  subscribe(fn: (e: t.DocEphemeralIn<T, M>) => void): void;
};

export type DocEphemeralFilter<T extends O, M extends t.CBOR> = (
  e: t.DocEphemeralIn<T, M>,
) => boolean;

/**
 * Events
 */
export type DocEvent<T extends O = O> =
  | DocChangedEvent<T>
  | DocDeletedEvent<T>
  | DocEphemeralEvent<T>;

/**
 * Event: Document change.
 */
export type DocChangedEvent<T extends O> = {
  type: 'crdt:doc/Changed';
  payload: DocChanged<T>;
};
export type DocChanged<T extends O = O> = t.ImmutableChange<T, P> & {
  uri: t.StringUri;
  source: t.PatchSource;
};

/**
 * Event: Document deleted.
 */
export type DocDeletedEvent<T extends O = O> = {
  type: 'crdt:doc/Deleted';
  payload: DocDeleted<T>;
};
export type DocDeleted<T extends O = O> = {
  uri: t.StringUri;
  doc: T;
};

/**
 * Event: Ephemeral message.
 * https://automerge.org/docs/repositories/ephemeral
 */
export type DocEphemeralEvent<T extends O = O> = DocEphemeralInEvent<T> | DocEphemeralOutEvent<T>;
export type DocEphemeralInEvent<T extends O = O, M extends t.CBOR = t.CBOR> = {
  type: 'crdt:doc/Ephemeral:in';
  payload: DocEphemeralIn<T, M>;
};
export type DocEphemeralIn<T extends O = O, M extends t.CBOR = t.CBOR> = EphemeralCommon<T> & {
  direction: 'incoming';
  sender: { id: string };
  message: M;
};

export type DocEphemeralOutEvent<T extends O = O> = {
  type: 'crdt:doc/Ephemeral:out';
  payload: DocEphemeralOut<T>;
};
export type DocEphemeralOut<T extends O = O> = EphemeralCommon<T> & {
  direction: 'outgoing';
  data: Uint8Array;
};
type EphemeralCommon<T extends O = O> = { doc: t.DocWithHandle<T> };
