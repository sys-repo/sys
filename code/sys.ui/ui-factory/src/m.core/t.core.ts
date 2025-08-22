import type { t } from './common.ts';

/** Base string IDs (narrow with generics in your modules). */
export type ViewId = string;
export type SlotId = string;

/** React.lazy-compatible module shape. */
export type LazyViewModule = { default: React.FC<any> };

/** Discriminated result for getView. */
export type GetViewResult = { ok: true; module: LazyViewModule } | { ok: false; error: t.StdError };

/** View contract: tiny and framework-agnostic. */
export type ViewSpec<Id extends ViewId = ViewId, Slot extends SlotId = SlotId> = {
  readonly id: Id;
  readonly schema?: t.TSchema;
  readonly slots?: readonly Slot[];
};

/** Registration pairs spec with lazy loader. */
export type Registration<Id extends ViewId = ViewId, Slot extends SlotId = SlotId> = {
  readonly spec: ViewSpec<Id, Slot>;
  load: () => Promise<LazyViewModule>;
};
