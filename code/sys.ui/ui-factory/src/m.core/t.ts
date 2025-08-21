import type { t } from './common.ts';

export type * from './t.core.factory.ts';
export type * from './t.core.plan.ts';
export type * from './t.core.ts';

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
  make<Id extends t.ViewId>(regs: readonly t.Registration<Id>[]): t.Factory<Id>;

  /**
   * Compose multiple factories into one (left → right precedence).
   * - Later factories overwrite earlier entries on id collisions.
   * - Returns a new factory; inputs are not mutated.
   */
  compose<Id extends t.ViewId>(factories: readonly t.Factory<Id>[]): t.Factory<Id>;
};

/**
 * Plan namespace:
 */
export type PlanLib = {
  /**
   * Validate canonical, factory-typed plan without mutation.
   */
  validate<F extends t.Factory<any, any>>(plan: t.Plan<F>, factory: F): t.PlanValidateResult;

  /**
   * Validate a linear plan (Id/Slot/Children) without mutation.
   * This is ideal for tests and simple authoring.
   */
  validateLinear<Id extends string, Slot extends string>(
    plan: t.LinearPlan<Id, Slot>,
    factory: t.FactoryWithSlots<Id, Slot>,
  ): t.PlanValidateResult;

  /**
   * Optional: Convert a linear plan into the canonical factory-typed plan.
   * Strategy is explicit to avoid hidden semantics.
   */
  fromLinear<Id extends string, Slot extends string, F extends t.FactoryWithSlots<Id, Slot>>(
    linear: t.LinearPlan<Id, Slot>,
    factory: F,
    opts?: { placeUnslotted?: 'first-slot' | 'reject' },
  ): t.Plan<F>;
};
