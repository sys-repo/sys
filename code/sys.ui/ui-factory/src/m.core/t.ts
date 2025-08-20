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
