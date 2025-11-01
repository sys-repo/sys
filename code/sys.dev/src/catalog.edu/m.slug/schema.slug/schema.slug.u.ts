import { Pattern, Type as T } from './common.ts';
import { TraitBindingSchema } from './schema.trait.ts';

const ID = T.String({ title: 'Slug identifier', ...Pattern.Id() });

const DESCRIPTION = T.String({
  title: 'Description',
  description: `Optional human-readable summary of the slug's purpose or contents.`,
});

const REF = T.String({
  ...Pattern.CrdtRef(),
  title: 'Reference',
  description: `Optional reference (URN or CRDT create tag) pointing to another slug definition.`,
});

const DATA = T.Record(T.String(), T.Unknown(), {
  description: `Serialized instance data keyed by trait alias. Each value is validated semantically against its trait's schema.`,
});

const TRAITS = T.Array(TraitBindingSchema, {
  description: `List of trait bindings applied to this slug. Each binding selects a trait type ('of') and assigns a local alias ('as') used in 'data'.`,
});

/**
 * (Internal): Isolated slug schema parts.
 */
export const SLUG = {
  ID,
  DESCRIPTION,
  REF,
  DATA,
  TRAITS,
} as const;
