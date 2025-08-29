import { type t } from '../common.ts';
import { spec as HarnessSpec } from '../ui/Harness/spec.ts';

type Regs = readonly t.ReactRegistration<t.CatalogId, t.CatalogSlot>[];

/**
 * Minimal registrations:
 * - Harness (two-slot shell)
 */
export const regs: Regs = [
  {
    spec: HarnessSpec,
    load: async () => ({ default: (await import('../ui/Harness/ui.tsx')).Harness }),
  },
];
