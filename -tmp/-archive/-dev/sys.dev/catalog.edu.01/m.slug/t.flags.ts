import type { t } from './common.ts';

/**
 * Type guards describing what kind of slug this is.
 */
export type SlugIsLib = {
  /** True if the slug is a reference variant (has `ref`). */
  ref(v: unknown): v is t.SlugRef;

  /** True if the slug is an inline variant (minimal or with-data). */
  inline(v: unknown): v is t.SlugMinimal | t.SlugWithData;
};

/**
 * Structural presence checks for slug contents.
 */
export type SlugHasLib = {
  /** True if the slug defines a non-empty `traits` array. */
  traits(
    slug: t.Slug,
  ): slug is (t.SlugMinimal | t.SlugWithData) & { traits: readonly t.SlugTraitBinding[] };

  /** True if the slug defines a `data` record. */
  data(slug: t.Slug): slug is t.SlugWithData;
};
