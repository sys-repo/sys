import { type t } from '../common.ts';
import { LayoutSchema } from './schema.ts';

type Reg = t.ReactRegistration<t.CatalogId, t.CatalogSlot>;

/**
 * View specification (id, slots, schema).
 * - Keep `id` stable; it’s referenced by plans/registrations.
 */
export const spec: Reg['spec'] = {
  id: 'Layout:view',
  schema: LayoutSchema,
  slots: [] as const,
};
