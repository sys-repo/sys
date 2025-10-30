import type { t } from './common.ts';

export type * from './t.Pattern.ts';

/**
 * Stable, unique identifier of the slug.
 * - Machine-oriented.
 * - Guaranteed unique across the containing document.
 */
export type SlugId = t.StringId;

/**
 * Identifier of a trait type expressed by the slug.
 * - Chosen from the registered trait library (e.g. "video", "image-sequence").
 */
export type SlugTraitId = t.StringId;

/**
 * Local alias bound to a trait instance.
 * - Human-readable display key within a slug.
 * - Allows multiple instances of the same trait type under different aliases.
 */
export type SlugTraitAlias = string;

/**
 * Canonical trait-binding type.
 */
export type SlugTraitBinding = {
  readonly of: t.SlugTraitId;
  readonly as: t.SlugTraitAlias;
};

/**
 * Utility Type: Narrow binding to a specific trait id.
 */
export type SlugTraitBindingOf<K extends SlugTraitBinding['of']> = Omit<SlugTraitBinding, 'of'> & {
  readonly of: K;
};

/**
 * Canonical "inline slug surface" (no children).
 * Matches the union of fields shared by SlugRef | SlugMinimal | SlugWithData.
 */
export type SlugSurface = {
  readonly id?: t.StringId;
  readonly description?: string;
  readonly ref?: string;
  readonly traits?: readonly t.SlugTraitBinding[];
  readonly data?: { readonly [key: string]: unknown };
};
