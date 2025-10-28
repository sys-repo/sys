import type { t } from '../common.ts';

export type * from './schema.slug/t.ts';
export type * from './schema.trait.registry/t.ts';
export type * from './schema.validation/t.ts';
export type * from './t.dsl.ts';

/**
 * Semantic Slug tools (core only).
 */
export type SlugLib = {
  readonly Schema: {
    readonly SlugSchema: t.TSchema;
    readonly TraitBindingSchema: t.TSchema;
    readonly TraitDefSchema: t.TSchema;
  };
  readonly Validation: t.SlugValidationLib;
};
