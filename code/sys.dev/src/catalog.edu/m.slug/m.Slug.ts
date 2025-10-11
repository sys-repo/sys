/**
 * @module Slug
 * Domain schemas, trait registry, and semantic validation rules.
 * Format-agnostic; used by YAML pipelines and future data sources.
 */
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
 *
 */
export const Slug = {
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
    TraitRegistryDefault,
  },
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
} as const;
