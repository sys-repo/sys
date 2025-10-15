import type { t } from './common.ts';
export type * from './t.type-gen.ts';

export type VideoRecorderBinding = t.SlugTraitBindingOf<'video-recorder'>;
export type VideoPlayerBinding = t.SlugTraitBindingOf<'video-player'>;

/**
 *
 */
export type SlugTraitsLib = {
  readonly Is: t.SlugTraitIsLib;
  readonly VideoPlayerPropsSchema: t.TSchema;
  readonly VideoRecorderPropsSchema: t.TSchema;
};

/**
 * Boolean predicates (type guards) for Slug entities.
 * Used for structural or semantic truth checks across the Slug domain.
 */
export type SlugTraitIsLib = {
  /**
   * True iff the value is a valid "video-recorder" trait binding
   * with a non-empty `as` alias.
   */
  readonly videoRecorderBinding: (m: unknown) => m is t.VideoRecorderBinding;

  /**
   * True iff the value is valid video-recorder props per the schema.
   */
  readonly videoRecorderProps: (u: unknown) => u is t.VideoRecorderProps;

  /**
   * (Optional, symmetry) True iff the value is valid video-player props per the schema.
   */
  readonly videoPlayerProps: (u: unknown) => u is t.VideoPlayerProps;
};
