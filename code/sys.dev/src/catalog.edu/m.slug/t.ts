import type { t } from '../common.ts';

export type * from './schema.slug/t.ts';
export type * from './schema.trait.registry/t.ts';
export type * from './schema.traits/t.ts';
export type * from './schema.validation/t.ts';

/**
 * Semantic Slug domain tools (registry-aware validators, helpers).
 */
export type SlugDomainLib = {
  readonly Schema: {
    readonly SlugSchema: t.TSchema;
    readonly TraitBindingSchema: t.TSchema;
    readonly TraitDefSchema: t.TSchema;
  };
  readonly Traits: {
    readonly VideoPlayerPropsSchema: t.TSchema;
    readonly VideoRecorderPropsSchema: t.TSchema;
  };
  readonly Registry: {
    readonly DefaultTraits: t.SlugTraitRegistry;
  };
  readonly Validation: t.SlugValidationLib;
};
