import { type t, Type as T } from './common.ts';

/**
 * Bind a trait type (id) to a local alias (as).
 * - `as` lets us have multiple instances of the same trait type.
 * - `id` selects the trait type from the registry/defs.
 */
export const TraitBindingSchema: t.TObject<{
  as: t.TString;
  id: t.TString;
}> = T.Object(
  {
    as: T.String({ pattern: '^[a-z][a-z0-9-]*$' }),
    id: T.String({ pattern: '^[a-z][a-z0-9-]*$' }),
  },
  { additionalProperties: false },
);

/**
 * Trait definition descriptor (catalog-level).
 * Concrete prop schemas live in a runtime registry (regs.ts).
 */
export const TraitDefSchema: t.TObject<{
  id: t.TString;
  props: t.TOptional<t.TUnknown>;
}> = T.Object(
  {
    id: T.String({ pattern: '^[a-z][a-z0-9-]*$' }),
    props: T.Optional(T.Unknown()),
  },
  { additionalProperties: false },
);
