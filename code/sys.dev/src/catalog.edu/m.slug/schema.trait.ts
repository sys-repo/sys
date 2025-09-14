import { Type } from './common.ts';

/**
 * Bind a trait type (id) to a local alias (as).
 * - `as` lets us have multiple instances of the same trait type.
 * - `id` selects the trait type from the registry/defs.
 */
export const TraitBindingSchema = Type.Object(
  {
    as: Type.String({ pattern: '^[a-z][a-z0-9-]*$' }),
    id: Type.String({ pattern: '^[a-z][a-z0-9-]*$' }),
  },
  { additionalProperties: false },
);

/**
 * Trait definition descriptor (catalog-level).
 * Concrete prop schemas live in a runtime registry (regs.ts).
 */
export const TraitDefSchema = Type.Object(
  {
    id: Type.String({ pattern: '^[a-z][a-z0-9-]*$' }),
    props: Type.Optional(Type.Unknown()),
  },
  { additionalProperties: false },
);
