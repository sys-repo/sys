import type { t } from './common.ts';

export type * from './t.flags.ts';
export type * from './t.type-gen.ts';

/**
 * Aggregate entry for all known slug-trait schemas and type guards.
 */
export type SlugTraitsLib = {
  readonly Is: t.SlugTraitIsLib;
  readonly Schema: {
    readonly SlugTree: { readonly Props: t.TSchema; readonly Item: t.TSchema };
    readonly VideoPlayer: { readonly Props: t.TSchema };
    readonly VideoRecorder: { readonly Props: t.TSchema };
    readonly ViewRenderer: { readonly Props: t.TSchema };
    readonly ConceptLayout: { readonly Props: t.TSchema };
    readonly TimeMap: { readonly Props: t.TSchema; readonly Item: t.TSchema };
    readonly FileList: {
      readonly Item: t.TSchema;
      readonly Props: t.TSchema; // canonical
      readonly Input: t.TSchema; // authoring union
    };
  };
};

/**
 * Slug bindings for each trait:
 */
export type SlugTreeBinding = t.SlugTraitBindingOf<'slug-tree'>;
export type VideoRecorderBinding = t.SlugTraitBindingOf<'video-recorder'>;
export type VideoPlayerBinding = t.SlugTraitBindingOf<'video-player'>;
export type ViewRendererBinding = t.SlugTraitBindingOf<'view-renderer'>;
export type ConceptLayoutBinding = t.SlugTraitBindingOf<'concept-layout'>;
export type FileListBinding = t.SlugTraitBindingOf<'file-list'>;
export type TimeMapBinding = t.SlugTraitBindingOf<'time-map'>;
