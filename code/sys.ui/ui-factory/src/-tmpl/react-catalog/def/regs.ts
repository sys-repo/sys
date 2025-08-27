import { type t } from '../common.ts';
import { HelloSchema } from '../ui/Hello/schema.ts';

type Regs = readonly t.ReactRegistration<t.CatalogId, t.CatalogSlot>[];

/**
 * Minimal registrations:
 * - explicit TypeBox schema on spec
 * - loader returns a React module shape (default export)
 */
export const regs: Regs = [
  {
    spec: { id: 'Hello:view', slots: [] as const, schema: HelloSchema },
    load: async () => ({
      default: (await import('../ui/Hello/ui.tsx')).Hello,
    }),
  },
];
