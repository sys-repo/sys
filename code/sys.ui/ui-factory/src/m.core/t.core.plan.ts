import type { t } from './common.ts';

/**
 * Plan:
 * Typed, framework-agnostic plan nodes derived from a Factory’s specs (id → slots).
 */

/** SlotsFor<F, Id> → the slot-name union for a given component Id, derived from its spec. */
export type SlotsFor<F extends t.Factory<any, any>, Id extends t.ViewIds<F>> = t.SpecOf<
  F,
  Id
> extends t.ViewSpec<any, infer S>
  ? S
  : never;

/**
 * PlanNodeFor<F, Id> → a single node whose `slots` keys are restricted to that view’s slots.
 * Children are recursively typed against the same factory.
 */
export type PlanNodeFor<F extends t.Factory<any, any>, Id extends t.ViewIds<F>> = Readonly<{
  component: Id;
  props?: unknown;
  slots?: Partial<{
    [K in SlotsFor<F, Id>]: PlanNode<F> | ReadonlyArray<PlanNode<F>>;
  }>;
  /** (optional) Stable identity for state continuity. */
  id?: string;
}>;

/**
 * PlanNode<F> → discriminated union over all component Ids in the factory.
 * Authoring a plan now gets slot-name autocompletion and type errors for invalid slots.
 */
export type PlanNode<F extends t.Factory<any, any>> = {
  [I in t.ViewIds<F>]: PlanNodeFor<F, I>;
}[t.ViewIds<F>];
