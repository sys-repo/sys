import { Type as T } from './common.ts';

/**
 * Properties: Video Player.
 */
export const VideoPlayerPropsSchema = T.Object(
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
