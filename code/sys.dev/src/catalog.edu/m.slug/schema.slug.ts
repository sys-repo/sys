import { type t, Type as T } from './common.ts';
import { TraitBindingSchema } from './schema.trait.ts';

/**
 * Slug core (v0): stable identity + trait bindings.
 * - `props` keyed by alias; semantic validation enforces per-trait shapes (next slice).
 */
export const SlugSchema: t.TObject<{
  id: t.TString;
  traits: t.TArray<typeof TraitBindingSchema>;
  props: t.TOptional<t.TRecord<t.TString, t.TUnknown>>;
}> = T.Object(
  {
    id: T.String({ pattern: '^[a-z0-9][a-z0-9-]*$' }),
    traits: T.Array(TraitBindingSchema),
    props: T.Optional(T.Record(T.String(), T.Unknown())),
  },
  { additionalProperties: false },
);
