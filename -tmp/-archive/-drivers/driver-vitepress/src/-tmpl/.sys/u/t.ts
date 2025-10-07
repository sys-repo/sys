import type { t } from './common.ts';

export type GlobalState = {
  tmp: number;
};

/**
 * Immutable wrapper.
 */
type P = t.PatchOperation;
export type GlobalStateImmutable = t.ImmutableRef<t.GlobalState, P, GlobalStateEvents>;

export type GlobalStateEvents = t.ImmutableEvents<GlobalState, P>;
export type GlobalStateEvent = t.InferImmutableEvent<t.GlobalStateEvents>;
