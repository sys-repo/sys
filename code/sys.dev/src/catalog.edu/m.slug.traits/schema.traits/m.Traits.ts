/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */
import { type t } from './common.ts';

import { Is } from './m.Is.ts';
import { TraitNormalizers as Normalizers } from './m.Normalizers.ts';

import { SlugIndexPropsSchema } from './schema.slug.index.ts';
import { SlugTreeItemSchema, SlugTreePropsSchema } from './schema.slug.tree.ts';
import { VideoPlayerPropsSchema } from './schema.video.player.ts';
import { VideoRecorderPropsSchema } from './schema.video.recorder.ts';

export const Traits: t.SlugTraitsLib = {
  get Is() {
    return Is;
  },
  get Normalizers() {
    return Normalizers;
  },

  // Schemas:
  get SlugIndexPropsSchema() {
    return SlugIndexPropsSchema;
  },
  get SlugTreeItemSchema() {
    return SlugTreeItemSchema;
  },
  get SlugTreePropsSchema() {
    return SlugTreePropsSchema;
  },
  get VideoPlayerPropsSchema() {
    return VideoPlayerPropsSchema;
  },
  get VideoRecorderPropsSchema() {
    return VideoRecorderPropsSchema;
  },
};
