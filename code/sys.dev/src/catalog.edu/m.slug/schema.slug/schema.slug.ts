import { type t, Type as T } from './common.ts';
import { SLUG } from './schema.slug.u.ts';

/**
 * Shared (reused) fields across slug variants.
 */
const SHARED = {
  id: T.Optional(SLUG.ID),
  description: T.Optional(SLUG.DESCRIPTION),
} as const;

/**
 * Slug (ref):
 * - Disjoint branch: optional id/description, plus optional ref.
 * - May NOT coexist with traits or data.
 */
export const SlugRefSchemaInternal = T.Object(
  { ...SHARED, ref: T.Optional(SLUG.REF) },
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
export const SlugMinimalSchemaInternal = T.Object(
  { ...SHARED, traits: T.Optional(SLUG.TRAITS) },
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
export const SlugWithDataSchemaInternal = T.Object(
  { ...SHARED, traits: SLUG.TRAITS, data: SLUG.DATA },
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
export const SlugSchemaInternal = T.Union(
  [SlugRefSchemaInternal, SlugMinimalSchemaInternal, SlugWithDataSchemaInternal],
  {
    $id: 'slug',
    title: 'Slug',
    description: `Slug core schema (v0): either a reference to another entity, or an inline definition with optional traits and data.`,
  },
);

/**
 * Public widened exports (JSR-safe: explicit t.TSchema surface).
 */
export const SlugSchema: t.TSchema = SlugSchemaInternal;
// Variants:
export const SlugRefSchema: t.TSchema = SlugRefSchemaInternal;
export const SlugMinimalSchema: t.TSchema = SlugMinimalSchemaInternal;
export const SlugWithDataSchema: t.TSchema = SlugWithDataSchemaInternal;
