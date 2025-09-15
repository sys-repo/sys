import { type t } from '../common.ts';
import { HarnessPropsSchema } from './schema.ts';

type Reg = t.ReactRegistration<t.CatalogId, t.CatalogSlot>;

/**
 * View specification (id, slots, schema).
 * Keep `id` stable; plans/registrations depend on it.
 */
export const spec: Reg['spec'] = {
  id: 'Harness:view',
  schema: HarnessPropsSchema,
  slots: ['left', 'right'] as const,
};
