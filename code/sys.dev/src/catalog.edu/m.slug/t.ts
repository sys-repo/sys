import type { t } from '../common.ts';

export type * from './schema.slug/t.ts';
export type * from './schema.trait.registry/t.ts';
export type * from './schema.traits/t.ts';
export type * from './schema.validation/t.ts';

/**
 * Semantic Slug domain tools (registry-aware validators, helpers).
 */
export type SlugLib = {
  readonly Is: t.SlugIsLib;
  readonly Schema: {
    readonly SlugSchema: t.TSchema;
    readonly TraitBindingSchema: t.TSchema;
    readonly TraitDefSchema: t.TSchema;
  };
  readonly Registry: { readonly DefaultTraits: t.SlugTraitRegistry };
  readonly Traits: {
    readonly VideoPlayerPropsSchema: t.TSchema;
    readonly VideoRecorderPropsSchema: t.TSchema;
  };
  readonly Validation: t.SlugValidationLib;
};

/**
 * Boolean predicates (type guards) for Slug entities.
 * Used for structural or semantic truth checks across the Slug domain.
 */
export type SlugIsLib = {
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
