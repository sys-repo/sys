import { type t, Type as T } from './common.ts';

/**
 * Properties: Video Player
 */
export const VideoPlayerPropsSchema: t.TSchema = T.Object(
  { name: T.String({ minLength: 1 }) },
  { additionalProperties: false },
);
