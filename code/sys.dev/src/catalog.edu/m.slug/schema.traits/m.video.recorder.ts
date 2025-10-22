import { Type as T } from './common.ts';
import { Pattern } from './u.Pattern.ts';

/**
 * Properties: Video Recorder.
 */
export const VideoRecorderPropsSchema = T.Object(
  {
    /** Display name (optional, non-empty if provided). */
    name: T.Optional(T.String({ minLength: 1 })),

    /** Top level summary. */
    description: T.Optional(T.String()),

    /** Text displayed to the speaker during recording. */
    script: T.Optional(
      T.String({
        title: 'Script Text',
        description: 'Script content displayed during recording. Supports plain text or Markdown.',
      }),
    ),

    /** Reference to a video file stored as a CRDT document. */
    file: T.Optional(
      T.String({
        title: 'CRDT File Reference (URN)',
        ...Pattern.refCrdt,
      }),
    ),
  },
  {
    $id: 'trait.video-recorder.props',
    title: 'Video Recorder Properties',
    additionalProperties: false,
  },
);
