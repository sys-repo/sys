import { type t } from '../common.ts';

type R = t.ReactRegistration<t.CatalogId, t.CatalogSlot>;
type F = t.Factory<t.CatalogId, R>;

/**
 * Build a canonical plan. Minimal caller props; schema stays strong.
 */
export function makePlan(props: Partial<t.HarnessProps> = {}): t.Plan<F> {
  const plan = {
    root: {
      component: 'Harness:view',
      props,
      // slots: { left: {...}, right: {...} } // add when ready.
    },
  } satisfies t.Plan<F>;
  return plan;
}
