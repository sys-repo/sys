/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */
import { type t } from './common.ts';

import { Is } from './m.Is.ts';
import { SlugIndexPropsSchema } from './m.slug.index.ts';
import { SlugTreeItemSchema, SlugTreePropsSchema } from './m.slug.tree.ts';
import { VideoPlayerPropsSchema } from './m.video.player.ts';
import { VideoRecorderPropsSchema } from './m.video.recorder.ts';

export {
  Is,
  SlugIndexPropsSchema,
  SlugTreeItemSchema,
  SlugTreePropsSchema,
  VideoPlayerPropsSchema,
  VideoRecorderPropsSchema,
};

export const Traits: t.SlugTraitsLib = {
  get Is() {
    return Is;
  },
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
