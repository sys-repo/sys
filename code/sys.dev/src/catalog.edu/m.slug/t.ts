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
    readonly SlugTree: { readonly Item: t.TSchema; readonly Props: t.TSchema };

    readonly SlugSchema: t.TSchema;
    readonly TraitBindingSchema: t.TSchema;
    readonly TraitDefSchema: t.TSchema;
  };
};
