import { type t } from '../common.ts';
import { HarnessSchema } from './schema.ts';

type Reg = t.ReactRegistration<t.CatalogId, t.CatalogSlot>;

/**
 * View specification (id, slots, schema).
 * Keep `id` stable; plans/registrations depend on it.
 */
export const spec = {
  id: 'Harness:view',
  schema: HarnessSchema,
  slots: ['left', 'right'] as const,
} satisfies Reg['spec'];
