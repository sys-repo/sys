import { type t, Type } from './common.ts';
import { TraitBindingSchema } from './schema.trait.ts';

/**
 * Slug core (v0): stable identity + trait bindings.
 * - `props` keyed by alias; semantic validation enforces per-trait shapes (next slice).
 */
export const SlugSchema = Type.Object(
  {
    id: Type.String({ pattern: '^[a-z0-9][a-z0-9-]*$' }),
    traits: Type.Array(TraitBindingSchema),
    props: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  },
  { additionalProperties: false },
);
