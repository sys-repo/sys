import { type t, Type as T } from './common.ts';

/**
 * Properties: Video Recorder
 */
export const VideoRecorderPropsSchema: t.TSchema = T.Object(
  { name: T.String({ minLength: 1 }) },
  { additionalProperties: false },
);
