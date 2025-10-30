/**
 * @module Slug
 * Domain schemas and semantic validation (core only).
 * Format-agnostic; used by YAML pipelines and future data sources.
 */
import type { t } from './common.ts';

import { Has } from './m.Slug.Has.ts';
import { Is } from './m.Slug.Is.ts';
import {
  SlugSchema,
  SlugTreeItemSchema,
  SlugTreePropsSchema,
  TraitBindingSchema,
  TraitDefSchema,
} from './schema.slug/mod.ts';
import { Validation } from './schema.validation/mod.ts';

/**
 * Semantic Slug domain tools (core only).
 * No concrete trait schemas or default registries here.
 */
export const Slug: t.SlugLib = {
  Is,
  Has,
  Validation,
  Schema: {
    SlugSchema,
    SlugTree: {
      get Item() {
        return SlugTreeItemSchema;
      },
      get Props() {
        return SlugTreePropsSchema;
      },
    },
    TraitBindingSchema,
    TraitDefSchema,
  },
};
