import type { t } from './common.ts';

/**
 * Plan: Typed, framework-agnostic plan nodes
 * derived from a Factory’s specs (id → slots).
 */

/**
 * SlotsFor<F, Id> → the slot-name union for a given component Id, derived from its spec.
 */
export type SlotsFor<F extends t.Factory<any, any>, Id extends t.ViewIds<F>> = t.SpecOf<
  F,
  Id
> extends t.ViewSpec<any, infer S>
  ? S
  : never;

/**
 * A single view node tied to a factory:
 * - `component`: which view to render.
 * - `slots`: children keyed by the view’s allowed slots (type-safe).
 * - `props`/`id`: data + stable identity.
 */
export type PlanNodeFor<F extends t.Factory<any, any>, Id extends t.ViewIds<F>> = {
  readonly component: Id;
  readonly props?: unknown;
  readonly slots?: Partial<{
    [K in t.SlotsFor<F, Id>]: PlanNode<F> | ReadonlyArray<PlanNode<F>>;
  }>;
  /** Stable identity for host state continuity (optional). */
  readonly id?: string;
};

/** Union over all possible nodes in a given factory. */
export type PlanNode<F extends t.Factory<any, any>> = {
  [I in t.ViewIds<F>]: PlanNodeFor<F, I>;
}[t.ViewIds<F>];

/** A full plan tree, anchored at a single root node. */
export type Plan<F extends t.Factory<any, any>> = {
  readonly root: PlanNode<F>;
};

/** Ergonomic "linear" authoring shape (Id/Slot/Children). */
export type LinearPlanNode<Id extends string, Slot extends string> = {
  readonly id: Id;
  readonly props?: unknown;
  readonly slot?: Slot;
  readonly children?: ReadonlyArray<LinearPlanNode<Id, Slot>>;
};

/** Lightweight, author-friendly plan (great for tests/DevHarness). */
export type LinearPlan<Id extends string, Slot extends string> = {
  readonly root: LinearPlanNode<Id, Slot>;
};

/** Validation result. */
export type PlanValidateOk = { ok: true };
export type PlanValidateErr = {
  readonly ok: false;
  readonly error: Readonly<{
    code: 'UNKNOWN_VIEW_ID' | 'INVALID_SLOT';
    message: string;
    /**
     * Path to the failing child as an array of indexes from the root's children.
     * Example: [0, 2] => root.children[0].children[2] in linear form
     * (For canonical form, the same index path corresponds to a depth-first child order.)
     */
    path: ReadonlyArray<number>;
    /** Only for INVALID_SLOT */
    allowed?: ReadonlyArray<string>;
    /** Only for INVALID_SLOT */
    got?: string | undefined;
  }>;
};
export type PlanValidateResult = PlanValidateOk | PlanValidateErr;

/**
 * A canonical plan node with its view module already resolved.
 * - Same shape as `PlanNode`, but guarantees `module` is loaded.
 * - Module type is adapter-specific (derived from the Factory).
 */
export type ResolvedPlanNode<F extends t.Factory<any, any>> = {
  readonly component: t.ViewIds<F>;
  readonly props?: unknown;
  readonly slots?: Partial<ResolvedPlanSlots<F>>;
  readonly module: t.ModuleOfFactory<F>;
};

/** Slot map for a resolved plan node. */
export type ResolvedPlanSlots<F extends t.Factory<any, any>> = {
  [K in t.SlotsFor<F, t.ViewIds<F>>]: ResolvedPlanNode<F> | ReadonlyArray<ResolvedPlanNode<F>>;
};

/**
 * Result of successfully resolving a plan.
 * - Provides the resolved root node.
 * - Includes a cache of modules by component id for reuse.
 */
export type ResolveOk<F extends t.Factory<any, any>> = {
  readonly ok: true;
  readonly root: ResolvedPlanNode<F>;
  readonly cache: ReadonlyMap<t.ViewIds<F>, t.ModuleOfFactory<F>>;
};

/** Result of a failed plan resolution. */
export type ResolveErr = {
  readonly ok: false;
  readonly error: t.StdError;
};

/** Union type for resolve results (success or failure). */
export type ResolveResult<F extends t.Factory<any, any>> = ResolveOk<F> | ResolveErr;
