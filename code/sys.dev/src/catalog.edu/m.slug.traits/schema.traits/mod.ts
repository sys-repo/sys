/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */

export { Is } from './m.Is.ts';
export { Traits } from './m.Traits.ts';

export {
  SlugTreeItemSchema,
  SlugTreeItemSchemaInternal,
  SlugTreePropsSchema,
  SlugTreePropsSchemaInternal,
} from './schema.slug.tree.ts';
export { VideoPlayerPropsSchema, VideoPlayerPropsSchemaInternal } from './schema.video.player.ts';
export {
  VideoRecorderPropsSchema,
  VideoRecorderPropsSchemaInternal,
} from './schema.video.recorder.ts';
