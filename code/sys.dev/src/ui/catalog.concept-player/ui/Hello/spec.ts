import { type t } from '../common.ts';
import { HelloSchema } from './schema.ts';

type Reg = t.ReactRegistration<t.CatalogId, t.CatalogSlot>;

/**
 * View specification (id, slots, schema).
 * - Keep `id` stable; it’s referenced by plans/registrations.
 */
export const spec: Reg['spec'] = {
  id: 'Hello:view',
  slots: [] as const,
  schema: HelloSchema,
};
