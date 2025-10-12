import { type t, Type as T } from './common.ts';

/**
 * Properties: Video Player
 * - Minimal valid: {}
 * - If present, `name` and `src` must be non-empty strings (minLength=1).
 */
export const VideoPlayerPropsSchema: t.TSchema = T.Object(
  {
    /**
     * Display name (optional, non-empty if provided).
     */
    name: T.Optional(T.String({ minLength: 1 })),

    /**
     * Top level summary.
     */
    description: T.Optional(T.String()),

    /**
     * Video source (optional, non-empty if provided).
     */
    src: T.Optional(T.String({ minLength: 1 })),
  },
  {
    $id: 'trait.video-player.props',
    title: 'Video Player Properties',
    additionalProperties: false,
  },
);
