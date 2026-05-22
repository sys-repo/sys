/**
 * @module Slug
 * Domain schemas and semantic validation (core only).
 * Format-agnostic; used by YAML pipelines and future data sources.
 */
import type { t } from './common.ts';

import { Has } from './m.Slug.Has.ts';
import { Is } from './m.Slug.Is.ts';
import {
  SlugMinimalSchema,
  SlugRefSchema,
  SlugSchema,
  SlugTreeItemSchema,
  SlugTreePropsSchema,
  SlugWithDataSchema,
  TraitBindingSchema,
  TraitDefSchema,
} from './schema.slug/mod.ts';
import { Validation } from './schema.validation/mod.ts';
import { Tree } from './tree/mod.ts';

/**
 * Semantic Slug domain tools (core only).
 * No concrete trait schemas or default registries here.
 */
export const Slug: t.SlugLib = {
  Is,
  Has,
  Validation,
  Tree,
  Schema: {
    get Slug() {
      return {
        Union: SlugSchema,
        Ref: SlugRefSchema,
        Minimal: SlugMinimalSchema,
        WithData: SlugWithDataSchema,
        Tree: { Props: SlugTreePropsSchema, Item: SlugTreeItemSchema },
      };
    },
    get Trait() {
      return {
        Binding: TraitBindingSchema,
        Def: TraitDefSchema,
      };
    },
  },
};
