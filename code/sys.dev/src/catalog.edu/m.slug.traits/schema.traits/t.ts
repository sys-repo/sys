import type { t } from './common.ts';
export type * from './t.type-gen.ts';

export type SlugIndexBinding = t.SlugTraitBindingOf<'slug-index'>;
export type VideoRecorderBinding = t.SlugTraitBindingOf<'video-recorder'>;
export type VideoPlayerBinding = t.SlugTraitBindingOf<'video-player'>;

/**
 * Aggregate entry for all known slug-trait schemas and type guards.
 */
export type SlugTraitsLib = {
  readonly Is: t.SlugTraitIsLib;
  readonly SlugIndexPropsSchema: t.TSchema;
  readonly VideoPlayerPropsSchema: t.TSchema;
  readonly VideoRecorderPropsSchema: t.TSchema;
};

/**
 * Boolean predicates (type guards) for Slug entities.
 * Used for structural or semantic truth checks across the Slug domain.
 */
export type SlugTraitIsLib = {
  /**
   * True iff the value is valid "slug-index" props per the schema.
   */
  slugIndexBinding(m: unknown): m is t.SlugIndexBinding;

  /**
   * True iff the value is a valid "video-recorder" trait binding
   * with a non-empty `as` alias.
   */
  videoRecorderBinding(m: unknown): m is t.VideoRecorderBinding;

  /**
   * True iff the value is valid "video-recorder" props per the schema.
   */
  videoRecorderProps(u: unknown): u is t.VideoRecorderProps;

  /**
   * (Optional, symmetry) True iff the value is valid video-player props per the schema.
   */
  videoPlayerProps(u: unknown): u is t.VideoPlayerProps;
};
