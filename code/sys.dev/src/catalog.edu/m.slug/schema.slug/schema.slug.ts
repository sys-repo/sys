import { type t, Type as T } from './common.ts';
import { Pattern } from './m.Pattern.ts';
import { TraitBindingSchema } from './schema.trait.ts';

/**
 * Shared (reused) fields across slug variants.
 */
const SHARED = {
  id: T.Optional(T.String({ title: `Slug identifier`, ...Pattern.idPattern() })),
  description: T.Optional(
    T.String({
      title: `Description`,
      description: `Optional human-readable summary of the slug's purpose or contents.`,
    }),
  ),
} as const;

/**
 * Traits field in two flavors: optional (minimal) vs. required (with data).
 */
const TRAITS = T.Array(TraitBindingSchema, {
  description: `List of trait bindings applied to this slug. Each binding selects a trait type (\`of\`) and assigns a local alias (\`as\`) used in \`data\`.`,
});

/**
 * Slug (ref): optional id/description, and optional ref.
 * May not coexist with traits/data (disjoint branch).
 */
const SlugRef = T.Object(
  {
    ...SHARED,
    ref: T.Optional(
      T.String({
        title: `Reference`,
        ...Pattern.crdtRefPattern(),
        description: `Optional reference pointing to the slug definition (CRDT/URN).`,
      }),
    ),
  },
  {
    $id: 'slug.ref',
    additionalProperties: false,
    description: `Slug (ref): optional id/description and pointer-reference. May not contain traits or data.`,
  },
);

/**
 * Slug (minimal): optional id/description and optional traits, NO data.
 */
const SlugMinimal = T.Object(
  {
    ...SHARED,
    traits: T.Optional(TRAITS),
  },
  {
    $id: 'slug.minimal',
    additionalProperties: false,
    description: `Slug (minimal): optional id/description and optional traits, with NO data.`,
  },
);

/**
 * Slug (rich): optional id/description, REQUIRED traits, and data.
 */
const SlugWithData = T.Object(
  {
    ...SHARED,
    traits: TRAITS,
    data: T.Record(T.String(), T.Unknown(), {
      description: `Serialized instance data keyed by trait alias. Each value is validated semantically against the corresponding trait's schema.`,
    }),
  },
  {
    $id: 'slug.with-data',
    additionalProperties: false,
    description: `Slug (rich): optional id/description, REQUIRED traits, and data record keyed by trait alias.`,
  },
);

/**
 * Public schema: disjoint union of all valid slug variants.
 *
 * Rules:
 * • "ref" variant cannot coexist with traits/data.
 * • "inline" variants (minimal/rich) cannot include ref.
 */
export const SlugSchema: t.TSchema = T.Union([SlugRef, SlugMinimal, SlugWithData], {
  $id: 'slug',
  title: `Slug`,
  description: `Slug core schema (v0). A slug is either a reference to another entity, or an inline definition with optional traits and data.`,
});
