/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */
import { type t, Slug } from './common.ts';
import { Is } from './m.Is.ts';

import { VideoPlayerPropsSchema } from './schema.video-player.ts';
import { VideoRecorderPropsSchema } from './schema.video-recorder.ts';
import { ViewRendererPropsSchema } from './schema.view-renderer.ts';

export const Traits: t.SlugTraitsLib = {
  get Is() {
    return Is;
  },

  // Schemas:
  Schema: {
    get SlugTree() {
      return Slug.Schema.Slug.Tree;
    },
    get VideoPlayer() {
      return { Props: VideoPlayerPropsSchema };
    },
    get VideoRecorder() {
      return { Props: VideoRecorderPropsSchema };
    },
    get ViewRenderer() {
      return { Props: ViewRendererPropsSchema };
    },
  },
};
