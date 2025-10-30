import type { t } from './common.ts';
export type * from './t.flags.ts';

/**
 * Aggregate entry for all known slug-trait schemas and type guards.
 */
export type SlugTraitsLib = {
  readonly Is: t.SlugTraitIsLib;
  readonly Schema: {
    readonly SlugTree: { readonly Item: t.TSchema; readonly Props: t.TSchema };
    readonly VideoPlayer: { readonly Props: t.TSchema };
    readonly VideoRecorder: { readonly Props: t.TSchema };
  };
};

/**
 * Slug bindings for each trait:
 */
export type SlugTreeBinding = t.SlugTraitBindingOf<'slug-tree'>;
export type VideoRecorderBinding = t.SlugTraitBindingOf<'video-recorder'>;
export type VideoPlayerBinding = t.SlugTraitBindingOf<'video-player'>;
