import { type t } from '../common.ts';
import { spec as HelloSpec } from '../ui/Hello/spec.ts';
import { spec as LayoutSpec } from '../ui/Layout/spec.ts';

type Regs = readonly t.ReactRegistration<t.CatalogId, t.CatalogSlot>[];

export const regs: Regs = [
  {
    spec: HelloSpec,
    load: async () => ({ default: (await import('../ui/Hello/ui.tsx')).Hello }),
  },
  {
    spec: LayoutSpec,
    load: async () => ({ default: (await import('../ui/Layout/ui.tsx')).Layout }),
  },
];
