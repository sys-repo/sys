import { type t, Type as T } from './common.ts';
import { Pattern } from './m.Pattern.ts';
import { TraitBindingSchema } from './schema.trait.ts';

/**
 * Slug core (v0): stable identity + trait bindings.
 * - `data` keyed by alias; semantic validation enforces per-trait shapes (next slice).
 */
export const SlugSchema: t.TObject<{
  id: t.TString;
  traits: t.TArray<typeof TraitBindingSchema>;
  data: t.TOptional<t.TRecord<t.TString, t.TUnknown>>;
}> = T.Object(
  {
    id: T.String({ title: `Slug identifier`, ...Pattern.idPattern() }),

    traits: T.Array(TraitBindingSchema, {
      description: `Array of trait bindings applied to this slug. Each binding selects a trait type (\`of\`) and assigns a local alias (\`as\`) used in \`data\`.`,
    }),

    data: T.Optional(
      T.Record(T.String(), T.Unknown(), {
        description: `Serialized instance data keyed by trait alias. Each value is validated semantically against the corresponding trait's schema.`,
      }),
    ),
  },
  {
    additionalProperties: false,
    description: `Slug core schema (v0). Provides stable identity, trait bindings, and instance data keyed by alias.`,
  },
);
