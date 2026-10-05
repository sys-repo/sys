import type { t } from './common.ts';

/** Base string IDs (narrow with generics in your modules). */
export type ViewId = string;
export type SlotId = string;

/** Abstract module produced by a registration loader (adapter-specific). */
export type ViewModule = unknown;

/** Discriminated result for getView (adapter-agnostic). */
export type GetViewResult<M = ViewModule> =
  | { ok: true; module: M }
  | { ok: false; error: t.StdError };

/** View contract: tiny and framework-agnostic. */
export type ViewSpec<Id extends ViewId = ViewId, Slot extends SlotId = SlotId> = {
  readonly id: Id;
  readonly schema?: t.TSchema;
  readonly slots?: readonly Slot[];
};

/** Registration pairs spec with lazy loader (adapter-agnostic). */
export type Registration<
  Id extends ViewId = ViewId,
  Slot extends SlotId = SlotId,
  M extends ViewModule = ViewModule,
> = {
  readonly spec: ViewSpec<Id, Slot>;
  load: () => Promise<M>;
};
