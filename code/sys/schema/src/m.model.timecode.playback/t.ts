import type { t } from './common.ts';

/**
 * Timecode playback wire-format schemas.
 */
export type TimecodePlaybackSchemaLib = {
  readonly Manifest: TimecodePlaybackManifestSchemaLib;
};

/**
 * Playback manifest schema surface.
 *
 * Payload is caller-defined; supply an optional payload schema to validate it.
 */
export type TimecodePlaybackManifestSchemaLib = {
  /**
   * Concrete JSONSchema for the manifest.
   * If payload is omitted, payload validates as unknown.
   */
  schema(args?: { payload?: t.TSchema }): t.TSchema;

  /** Standard Schema adapter for the manifest schema. */
  standard(args?: { payload?: t.TSchema }): t.StandardSchemaV1<unknown, PlaybackManifest>;

  /** Parse + validate an unknown input into a typed manifest result. */
  parse<P = unknown>(
    input: unknown,
    args?: { payload?: t.TSchema },
  ): t.SchemaResult<PlaybackManifest<P>>;
};

/**
 * Wire manifest written by tools and consumed by UI.
 * Mirrors @sys/std Timecode playback spec, plus docid.
 */
export type PlaybackManifest<P = unknown> = {
  readonly docid: t.StringId;
  readonly composition: t.Timecode.Composite.Spec;
  readonly beats: t.Timecode.Playback.Spec<P>['beats'];
};
