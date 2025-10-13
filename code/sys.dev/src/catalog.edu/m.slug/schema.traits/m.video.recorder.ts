import { type t, Type as T } from './common.ts';

/**
 * Properties: Video Recorder.
 */
export const VideoRecorderPropsSchema: t.TSchema = T.Object(
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

    /**
     * Reference to a video file stored as a CRDT document.
     * Accepts either:
     * - "crdt:<base62-28>/[optional/path]"
     * - "urn:crdt:<base62-28>/[optional/path]"
     * - "crdt:create"
     */
    file: T.Optional(
      T.String({
        title: 'CRDT File Reference (URN)',
        description: `Accepts "crdt:<uuid|base62-28>/[optional/path]" or "urn:crdt:<uuid|base62-28>/[optional/path]" or "crdt:create".`,
        pattern: `^(?:crdt:create|(?:urn:)?crdt:(?:[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}|[A-Za-z0-9]{28})(?:/[A-Za-z0-9._\\-/]*)?)$`,
      }),
    ),
  },
  {
    $id: 'trait.video-recorder.props',
    title: 'Video Recorder Properties',
    additionalProperties: false,
  },
);
