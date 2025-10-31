import type { t } from '../common.ts';

export type * from './schema.slug/t.ts';
export type * from './schema.trait.registry/t.ts';
export type * from './schema.validation/t.ts';
export type * from './t.flags.ts';
export type * from './t.type-gen.ts';

/**
 * Semantic Slug tools (core only).
 */
export type SlugLib = {
  readonly Is: t.SlugIsLib;
  readonly Has: t.SlugHasLib;
  readonly Validation: t.SlugValidationLib;
  readonly Tree: t.SlugTreeLib;
  readonly Surface: t.SlugSurfaceLib;
  readonly Schema: {
    readonly Slug: {
      readonly Union: t.TSchema;
      readonly Ref: t.TSchema;
      readonly Minimal: t.TSchema;
      readonly WithData: t.TSchema;
      readonly Tree: { readonly Props: t.TSchema; readonly Item: t.TSchema };
    };
    readonly Trait: { readonly Def: t.TSchema; readonly Binding: t.TSchema };
  };
};

/**
 * Trees of Slugs.
 */
export type SlugTreeLib = {
  readonly Is: {
    /** True iff `u` satisfies the core SlugTree props schema. */
    props(u: unknown): u is t.SlugTreeProps;
  };
};

/**
 * Lightweight projector for producing canonical “slug surfaces.”
 * Converts complex tree nodes into their inline slug form
 * (the union of fields shared by SlugRef | SlugMinimal | SlugWithData).
 *
 * Used by validators, normalizers, and serializers needing
 * a consistent, child-free slug snapshot.
 */
export type SlugSurfaceLib = {
  fromTreeItem(node?: t.SlugTreeItem): t.SlugSurface;
};
