import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Hook that manages loading a CRDT document reference.
 */
export type UseCrdtDoc<T extends O = O> = (
  repo?: t.Crdt.Repo,
  id?: t.StringDocumentId,
  onReady?: t.CrdtDocHookReadyHandler<T>,
) => t.CrdtDocHook<T>;

/**
 * Instance snapshot of the `useDoc` hook.
 */
export type CrdtDocHook<T extends O> = {
  readonly doc?: t.Crdt.Ref<T>;
  readonly error?: t.StdError;
};

/**
 * Handles when a document id loaded and ready (or has error'd out).
 */
export type CrdtDocHookReadyHandler<T extends O = O> = (e: CrdtDocHookReady<T>) => void;
export type CrdtDocHookReady<T extends O> = {
  readonly doc?: t.Crdt.Ref<T>;
  readonly error?: t.StdError;
};
