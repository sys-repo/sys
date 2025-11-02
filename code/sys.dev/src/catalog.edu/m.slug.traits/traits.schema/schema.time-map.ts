import { type t, Pattern, Type as T } from './common.ts';

/** WebVTT timestamp (dot before milliseconds). */
const WEBVTT_TIMESTAMP = '^(?:\\d{2}:)?[0-5]\\d:[0-5]\\d\\.\\d{3}$';

/**
 * Map value: optional path-ref and optional display name.
 */
export const TimeMapValueItemSchemaInternal = T.Object(
  {
    ref: T.Optional(
      T.String({
        ...Pattern.Ref.Path({ description: 'Path reference associated with this time.' }),
      }),
    ),
    name: T.Optional(T.String({ description: 'Display name for this time.' })),
  },
  {
    $id: 'trait.time-map.value',
    title: 'Time Map Value',
    additionalProperties: false,
  },
);

/** Map value entry: either a path-ref string or the object form above. */
const TimeMapValueEntrySchemaInternal = T.Union(
  [
    T.String({ ...Pattern.Ref.Path({ description: 'Path reference for this time.' }) }),
    TimeMapValueItemSchemaInternal,
  ],
  { description: 'Either a path-ref string or an object with optional ref/name.' },
);

/**
 * Timestamps keyed by WebVTT timecode (e.g. "00:03:25.000" or "03:25.000").
 * Value is either a path-ref string or an object { ref?, name? }.
 */
const TimestampsRecordSchemaInternal = T.Record(
  T.String({
    pattern: WEBVTT_TIMESTAMP,
    description: 'WebVTT timecode HH:MM:SS.mmm or MM:SS.mmm.',
  }),
  TimeMapValueEntrySchemaInternal,
  {
    description: 'Map of WebVTT timecode → value entry.',
    additionalProperties: false, // forbid non-matching keys
  },
);

/**
 * Properties: Time Map.
 */
export const TimeMapPropsSchemaInternal = T.Object(
  {
    id: T.Optional(T.String({ title: 'Formal identifier of the time map.', ...Pattern.Id() })),
    name: T.Optional(T.String({ description: 'Display name for the time map.' })),
    description: T.Optional(T.String({ description: 'Description of the time map.' })),
    timestamps: T.Optional(TimestampsRecordSchemaInternal),
  },
  {
    $id: 'trait.time-map.props',
    title: 'Time Map Properties',
    additionalProperties: false,
  },
);

/**
 * Public widened export (JSR-safe: explicit t.TSchema surface).
 */
export const TimeMapPropsSchema: t.TSchema = TimeMapPropsSchemaInternal;
export const TimeMapValueItemSchema: t.TSchema = TimeMapValueItemSchemaInternal;
