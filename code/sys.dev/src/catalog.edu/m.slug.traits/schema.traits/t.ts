import type { t } from './common.ts';

export type * from './t.bool.ts';
export type * from './t.normalize.ts';
export type * from './t.type-gen.ts';

/**
 * Aggregate entry for all known slug-trait schemas and type guards.
 */
export type SlugTraitsLib = {
  readonly Is: t.SlugTraitIsLib;
  readonly Normalizers: t.TraitNormalizers;
  // Schemas:
  readonly Schema: {
    readonly SlugTree: { readonly ItemSchema: t.TSchema; readonly PropsSchema: t.TSchema };
    readonly VideoPlayer: { readonly PropsSchema: t.TSchema };
    readonly VideoRecorder: { readonly PropsSchema: t.TSchema };
  };
};

/**
 * Slug bindings for each trait:
 */
export type SlugTreeBinding = t.SlugTraitBindingOf<'slug-tree'>;
export type VideoRecorderBinding = t.SlugTraitBindingOf<'video-recorder'>;
export type VideoPlayerBinding = t.SlugTraitBindingOf<'video-player'>;
