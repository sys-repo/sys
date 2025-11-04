/**
 * @module Trait-Schemas
 * Aggregates all trait prop-schema modules.
 */
export { Is } from './m.Is.ts';
export { Traits } from './m.Traits.ts';

/**
 * Schemas:
 */
export {
  ConceptLayoutPropsSchema,
  ConceptLayoutPropsSchemaInternal,
} from './schema.concept-layout.ts';
export {
  //
  FileListPropsSchema,
  FileListPropsSchemaInternal,
} from './schema.file-list.ts';
export {
  //
  TimeMapPropsSchema,
  TimeMapPropsSchemaInternal,
} from './schema.time-map.ts';
export {
  //
  VideoPlayerPropsSchema,
  VideoPlayerPropsSchemaInternal,
} from './schema.video-player.ts';
export {
  VideoRecorderPropsSchema,
  VideoRecorderPropsSchemaInternal,
} from './schema.video-recorder.ts';
export { ViewRendererPropsSchema } from './schema.view-renderer.ts';
