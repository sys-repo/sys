import { type t, Type as T } from './common.ts';
import { Pattern } from './m.Pattern.ts';
import { TraitBindingSchema } from './schema.trait.ts';

/**
 * Shared (reused) fields across slug variants.
 */
const SHARED = {
  id: T.Optional(T.String({ title: 'Slug identifier', ...Pattern.idPattern() })),
  description: T.Optional(
    T.String({
      title: 'Description',
      description: `Optional human-readable summary of the slug's purpose or contents.`,
    }),
  ),
} as const;

/**
 * Traits array definition.
 */
const TRAITS = T.Array(TraitBindingSchema, {
  description: `List of trait bindings applied to this slug. Each binding selects a trait type ('of') and assigns a local alias ('as') used in 'data'.`,
});

/**
 * Slug (ref):
 * - Disjoint branch: optional id/description, plus optional ref.
 * - May NOT coexist with traits or data.
 */
export const SlugRefSchema = T.Object(
  {
    ...SHARED,
    ref: T.Optional(
      T.String({
        ...Pattern.crdtRefPattern(),
        title: 'Reference',
        description: `Optional reference (URN or CRDT create tag) pointing to another slug definition.`,
      }),
    ),
  },
  {
    $id: 'slug.ref',
    additionalProperties: false,
    description: `Slug (ref): pointer-only form; cannot contain traits or data.`,
  },
);

/**
 * Slug (minimal):
 * - Optional id/description.
 * - Optional traits.
 * - NO data field.
 */
export const SlugMinimalSchema = T.Object(
  {
    ...SHARED,
    traits: T.Optional(TRAITS),
  },
  {
    $id: 'slug.minimal',
    additionalProperties: false,
    description: `Slug (minimal): optional id/description and optional traits, with no data.`,
  },
);

/**
 * Slug (rich):
 * - Optional id/description.
 * - REQUIRED traits.
 * - REQUIRED data record keyed by trait alias.
 */
export const SlugWithDataSchema = T.Object(
  {
    ...SHARED,
    traits: TRAITS,
    data: T.Record(T.String(), T.Unknown(), {
      description: `Serialized instance data keyed by trait alias. Each value is validated semantically against its trait's schema.`,
    }),
  },
  {
    $id: 'slug.with-data',
    additionalProperties: false,
    description: `Slug (rich): optional id/description, required traits, and corresponding data.`,
  },
);

/**
 * Public schema: disjoint union of all valid slug variants.
 *
 * Rules:
 * • The "ref" variant cannot coexist with traits/data.
 * • The "inline" variants (minimal/rich) cannot include a ref.
 */
export const SlugSchema: t.TSchema = T.Union(
  [SlugRefSchema, SlugMinimalSchema, SlugWithDataSchema],
  {
    $id: 'slug',
    title: 'Slug',
    description: `Slug core schema (v0): either a reference to another entity, or an inline definition with optional traits and data.`,
  },
);
