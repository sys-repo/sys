/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */
import { type t } from './common.ts';

import { Is } from './m.Is.ts';
import { TraitNormalizers as Normalizers } from './m.Normalizers.ts';

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
  Schema: {
    SlugTree: {
      get Item() {
        return SlugTreeItemSchema;
      },
      get Props() {
        return SlugTreePropsSchema;
      },
    },
    VideoPlayer: {
      get Props() {
        return VideoPlayerPropsSchema;
      },
    },
    VideoRecorder: {
      get Props() {
        return VideoRecorderPropsSchema;
      },
    },
  },
};
