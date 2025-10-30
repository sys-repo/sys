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
  readonly Tree: t.SlugTreeLib;
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
