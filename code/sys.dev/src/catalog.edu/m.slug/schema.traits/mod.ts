/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */
import { type t } from './common.ts';

import { Is } from './m.Is.ts';
import { SlugIndexPropsSchema } from './m.slug.index.ts';
import { VideoPlayerPropsSchema } from './m.video.player.ts';
import { VideoRecorderPropsSchema } from './m.video.recorder.ts';

export { Is, SlugIndexPropsSchema, VideoPlayerPropsSchema, VideoRecorderPropsSchema };

export const Traits: t.SlugTraitsLib = {
  get Is() {
    return Is;
  },
  get SlugIndexPropsSchema() {
    return SlugIndexPropsSchema;
  },
  get VideoPlayerPropsSchema() {
    return VideoPlayerPropsSchema;
  },
  get VideoRecorderPropsSchema() {
    return VideoRecorderPropsSchema;
  },
};
