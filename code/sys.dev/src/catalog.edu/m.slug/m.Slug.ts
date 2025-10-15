/**
 * @module Slug
 * Domain schemas, trait registry, and semantic validation rules.
 * Format-agnostic; used by YAML pipelines and future data sources.
 */
import type { t } from './common.ts';

import { Is } from './m.Is.ts';
import { Validation } from './schema.validation/mod.ts';

import { SlugSchema, TraitBindingSchema, TraitDefSchema } from './schema.slug/mod.ts';
import { TraitRegistryDefault } from './schema.trait.registry/mod.ts';
import { VideoPlayerPropsSchema, VideoRecorderPropsSchema } from './schema.traits/mod.ts';

/**
 * Semantic Slug domain tools (registry-aware validators, helpers).
 */
export const Slug: t.SlugLib = {
  Is,
  Validation,
  Schema: {
    SlugSchema,
    TraitBindingSchema,
    TraitDefSchema,
  },
  Traits: {
    VideoPlayerPropsSchema,
    VideoRecorderPropsSchema,
  },
  Registry: {
    DefaultTraits: TraitRegistryDefault,
  },
};
