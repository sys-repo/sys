import { type t } from '../common.ts';
import { spec as HelloSpec } from '../ui/Hello/spec.ts';

type Regs = readonly t.ReactRegistration<t.CatalogId, t.CatalogSlot>[];

/**
 * Minimal registrations:
 * - spec factored into `ui/Hello/spec.ts`
 * - loader returns a React module shape (default export)
 */
export const regs: Regs = [
  {
    spec: HelloSpec,
    load: async () => ({ default: (await import('../ui/Hello/ui.tsx')).Hello }),
  },
];
