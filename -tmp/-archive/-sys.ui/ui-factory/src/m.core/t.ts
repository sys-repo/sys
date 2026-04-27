import type { t } from './common.ts';

export type * from './t.core.factory.ts';
export type * from './t.core.plan.ts';
export type * from './t.core.render.ts';
export type * from './t.core.ts';

type ComposeFn =
  // Infer Id union (and Reg) from a tuple of factories
  {
    <const Fs extends readonly t.Factory<any, any>[]>(factories: [...Fs]): t.Factory<
      t.ViewIds<Fs[number]>,
      Fs[number] extends t.Factory<any, infer Reg> ? Reg : never
    >;
  } & {
    // Homogeneous Id factory arrays.
    <Id extends t.ViewId>(factories: readonly t.Factory<Id>[]): t.Factory<Id>;
  };

/**
 * Factory namespace:
 */
export type FactoryLib = {
  /**
   * Build a read-only registry from a list of registrations.
   * - Keys the registry by `spec.id`.
   * - Returns `{ specs, getView }` where `getView(id)` lazy-loads the view bundle.
   * - Unknown ids return `{ ok:false, error }` (no throw).
   */
  make<Id extends t.ViewId, Reg extends t.Registration<Id, t.SlotId, any>>(
    regs: readonly Reg[],
  ): t.Factory<Id, Reg>;

  /**
   * (Overloaded)
   * Compose multiple factories into one (left → right precedence).
   * - Later factories overwrite earlier entries on id collisions.
   * - Returns a new factory; inputs are not mutated.
   */
  compose: ComposeFn;
};

/**
 * Plan namespace:
 */
export type PlanLib = {
  /** Tools for working with linear plans (Id/Slot/Children). */
  readonly Linear: t.LinearPlanLib;

  /**
   * Validate canonical, factory-typed plan without mutation.
   */
  validate<F extends t.Factory<any, any>>(plan: t.Plan<F>, factory: F): t.PlanValidateResult;

  /**
   * Resolve a canonical plan into a tree with loaded view modules.
   *
   * - Walks the canonical `Plan<F>` and, for each node, loads its module via `factory.getView`.
   * - Memoizes by component id, so the same view id only loads once (even if used many times).
   * - Returns `{ ok:true, root, cache }` on success, where `cache` is a `Map<id,module>`.
   * - If any load fails or an id is unknown, returns `{ ok:false, error }` (uses your StdError surface).
   * - Does not mutate the input plan or factory.
   */
  resolve<F extends t.Factory<any, any>>(plan: t.Plan<F>, factory: F): Promise<t.ResolveResult<F>>;
};

/**
 * LinearPlan namespace.
 */
export type LinearPlanLib = {
  /**
   * Validate a linear plan (Id/Slot/Children) without mutation.
   * This is ideal for tests and simple authoring.
   */
  validate<Id extends string, Slot extends string>(
    plan: t.LinearPlan<Id, Slot>,
    factory: t.FactoryWithSlots<Id, Slot>,
  ): t.PlanValidateResult;

  /**
   * Convert a linear plan into the canonical factory-typed plan.
   */
  toCanonical<Id extends string, Slot extends string, F extends t.FactoryWithSlots<Id, Slot>>(
    linear: t.LinearPlan<Id, Slot>,
    factory: F,
    opts?: { placeUnslotted?: 'first-slot' | 'reject' },
  ): t.Plan<F>;
};
