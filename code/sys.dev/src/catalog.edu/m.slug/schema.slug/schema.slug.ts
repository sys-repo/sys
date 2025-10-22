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
    id: T.String({
      description: `Stable slug identifier. Must start with a lowercase letter or number; may contain lowercase letters, numbers, hyphens, and periods (e.g. "video.player-01").`,
      pattern: '^[a-z0-9][a-z0-9.-]*$',
    }),

    traits: T.Array(TraitBindingSchema, {
      description: `Array of trait bindings applied to this slug. Each binding defines a trait ID and alias used in \`props\`.`,
    }),

    props: T.Optional(
      T.Record(T.String(), T.Unknown(), {
        description: `Properties keyed by trait alias. Each entry’s value is validated semantically according to the corresponding trait’s schema.`,
      }),
    ),
  },
  {
    additionalProperties: false,
    description: `Slug core schema (v0). Provides stable identity, trait bindings, and associated props keyed by alias.`,
  },
);
