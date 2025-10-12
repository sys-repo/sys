import { type t, Type as T } from './common.ts';

/**
 * Trait: Video Recorder
 *
 * Describes metadata and reference details for a recorded video resource.
 * Typically used when a recording (e.g., from a live capture or meeting)
 * is stored as a CRDT-addressable document with an optional file path suffix.
 */
export const VideoRecorderPropsSchema: t.TSchema = T.Object(
  {
    /**
     * Display name shown in the catalog UI.
     * Example: "User Camera Feed"
     */
    name: T.Optional(
      T.String({
        title: 'Display Name',
        description: 'Human-readable name for the video recording.',
      }),
    ),

    /**
     * Short top-level summary of the recording or its purpose.
     * Example: "Introductory TAME ('Technological Approach to Mind Everywhere')"
     */
    description: T.Optional(
      T.String({
        title: 'Description',
        description: 'Brief summary or contextual description of the recording.',
      }),
    ),

    /**
     * Reference to the underlying CRDT document containing the video file.
     *
     * Format: `"urn:crdt:<uuid>/[optional/path]"`
     *
     * Example:
     * ```text
     * urn:crdt:39qozZJjQtT4erkWxMsGc4jed3Xr/video.mp4
     * ```
     */
    file: T.String({
      title: 'CRDT File Reference (URN)',
      description:
        'Reference to a CRDT document or file resource. Format: "urn:crdt:<uuid>/[optional/path]"',
      pattern: '^urn:crdt:[0-9a-fA-F-]{36}(?:/[a-zA-Z0-9._\\-/]*)?$',
    }),
  },
  {
    $id: 'trait.video-recorder.props',
    title: 'Video Recorder Properties',
    description:
      'Defines the properties for the "video-recorder" trait, describing a CRDT-linked recorded video resource.',
    additionalProperties: false,
  },
);
