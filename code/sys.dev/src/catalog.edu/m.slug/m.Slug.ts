/**
 * @module Slug
 * Domain schemas, trait registry, and semantic validation rules.
 * Format-agnostic; used by YAML pipelines and future data sources.
 */
import type { t } from './common.ts';

import { SlugSchema, TraitBindingSchema, TraitDefSchema } from './schema.slug/mod.ts';
import { TraitRegistryDefault } from './schema.trait.registry/mod.ts';
import { Traits } from './schema.traits/mod.ts';
import { Validation } from './schema.validation/mod.ts';

/**
 * Semantic Slug domain tools (registry-aware validators, helpers).
 */
export const Slug: t.SlugLib = {
  Validation,
  Traits,
  Registry: { DefaultTraits: TraitRegistryDefault },
  Schema: {
    SlugSchema,
    TraitBindingSchema,
    TraitDefSchema,
  },
};
