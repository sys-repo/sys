/**
 * @module Slug
 * Domain schemas, trait registry, and semantic validation rules.
 * Format-agnostic; used by YAML pipelines and future data sources.
 */
import type { t } from './common.ts';

import { SlugSchema, TraitBindingSchema, TraitDefSchema } from './schema.slug/mod.ts';
import { TraitRegistryDefault } from './schema.trait.registry/mod.ts';
import { VideoPlayerPropsSchema, VideoRecorderPropsSchema } from './schema.traits/mod.ts';
import {
  attachSemanticRanges,
  semanticErrorsToDiagnostics,
  semanticErrorsToEditorDiagnostics,
  validateAliasRules,
  validatePropsShape,
  validateSlug,
  validateSlugAgainstRegistry,
  validateTraitExistence,
  validateWithRanges,
} from './schema.validation/mod.ts';

/**
 * Semantic Slug domain tools (registry-aware validators, helpers).
 */
export const Slug: t.SlugDomainLib = {
  Schema: { SlugSchema, TraitBindingSchema, TraitDefSchema },
  Traits: { VideoPlayerPropsSchema, VideoRecorderPropsSchema },
  Registry: { DefaultTraits: TraitRegistryDefault },
  Validation: {
    validateTraitExistence,
    validateAliasRules,
    validatePropsShape,
    validateSlug,
    validateSlugAgainstRegistry,
    validateWithRanges,
    attachSemanticRanges,
    semanticErrorsToDiagnostics,
    semanticErrorsToEditorDiagnostics,
  },
};
