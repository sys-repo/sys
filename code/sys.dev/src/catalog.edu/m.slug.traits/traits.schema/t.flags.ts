import type { t } from './common.ts';

/**
 * Boolean predicates (type guards) for Slug entities.
 * Used for structural or semantic truth checks across the Slug domain.
 */
export type SlugTraitIsLib = {
  /**
   * True iff the value is a valid "slug-tree" props per the schema.
   */
  slugTreeProps(u: unknown): u is t.SlugTreeProps;

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
   * True iff the value is a valid "video-player" trait binding
   * with a non-empty `as` alias.
   */
  videoPlayerBinding(m: unknown): m is t.VideoPlayerBinding;

  /**
   * True iff the value is valid "video-player" props per the schema.
   */
  videoPlayerProps(u: unknown): u is t.VideoPlayerProps;

  /**
   * True iff the value is valid "concept-layout" props per the schema.
   */
  conceptLayoutProps(u: unknown): u is t.ConceptLayoutProps;
};
