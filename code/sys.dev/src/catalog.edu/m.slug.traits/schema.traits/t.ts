import type { t } from './common.ts';

export type * from './t.bool.ts';
export type * from './t.normalize.ts';
export type * from './t.type-gen.ts';

/**
 * Aggregate entry for all known slug-trait schemas and type guards.
 * Note: keep this strictly aligned with actual exported schemas (truthful surface).
 */
export type SlugTraitsLib = {
  readonly Is: t.SlugTraitIsLib;
  readonly Normalizers: t.TraitNormalizers;

  // Schemas:
  readonly SlugTreeItemSchema: t.TSchema;
  readonly SlugTreePropsSchema: t.TSchema;
  readonly VideoPlayerPropsSchema: t.TSchema;
  readonly VideoRecorderPropsSchema: t.TSchema;
};

/**
 * Slug bindings for each trait:
 */
export type SlugTreeBinding = t.SlugTraitBindingOf<'slug-tree'>;
export type VideoRecorderBinding = t.SlugTraitBindingOf<'video-recorder'>;
export type VideoPlayerBinding = t.SlugTraitBindingOf<'video-player'>;
