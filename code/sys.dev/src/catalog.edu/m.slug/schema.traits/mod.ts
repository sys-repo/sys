/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */
import { type t } from './common.ts';

import { Is } from './m.Is.ts';
import { VideoPlayerPropsSchema } from './m.video.player.ts';
import { VideoRecorderPropsSchema } from './m.video.recorder.ts';

export const Traits: t.SlugTraitsLib = {
  Is,
  VideoPlayerPropsSchema,
  VideoRecorderPropsSchema,
};

export { Is, VideoPlayerPropsSchema, VideoRecorderPropsSchema };
