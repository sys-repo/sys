import { type t } from './common.ts';
import { HelloSchema } from './ui/Hello/schema.ts';

/**
 * Minimal registrations:
 * - explicit TypeBox schema on spec
 * - loader returns a React module shape (default export)
 */
export const regs = [
  {
    spec: { id: 'Hello:view', slots: [], schema: HelloSchema },
    load: async () => ({
      default: (_: t.Infer<typeof HelloSchema>) => null,
    }),
  },
] satisfies readonly t.ReactRegistration<t.CatalogId, t.CatalogSlot>[];
