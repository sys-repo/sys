import { type t } from '../common.ts';
import { spec as HelloSpec } from '../ui/Hello/spec.ts';
import { spec as LayoutSpec } from '../ui/Layout/spec.ts';

type R = t.ReactRegistration<t.CatalogId, t.CatalogSlot>;
type F = t.Factory<t.CatalogId, R>;

/**
 * Build a canonical plan demonstrating Layout with slots.
 */
export function makePlan(): t.Plan<F> {
  return {
    root: {
      component: LayoutSpec.id, // "Layout:view"
      props: { align: 'Center', centerWidth: 560, gap: 48, debug: true },
      slots: {
        center: { component: HelloSpec.id, props: { name: 'Center' } },
        left: { component: HelloSpec.id, props: { name: 'Left' } },
        right: { component: HelloSpec.id, props: { name: 'Right' } },
      },
    },
  };
}
