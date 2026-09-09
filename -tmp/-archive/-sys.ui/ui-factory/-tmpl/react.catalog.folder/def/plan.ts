import { type t } from '../common.ts';

type R = t.ReactRegistration<t.CatalogId, t.CatalogSlot>;
type F = t.Factory<t.CatalogId, R>;

/**
 * Build a canonical plan. Minimal caller props; schema stays strong.
 */
export function makePlan(opts: Partial<t.HelloProps> = {}): t.Plan<F> {
  const props = { name: 'World', ...opts } satisfies t.HelloProps;
  return {
    root: {
      component: 'Hello:view',
      props,
      // slots: { } // ← 🐷 add named slots later if/when you declare them.
    },
  };
}
