import { type t, Type as T } from '../common.ts';

/** Timestamp (WebVTT-flex): allow MM:SS, HH:MM:SS, HH:MM:SS.mmm. */
const WEBVTT_TIMESTAMP = '^(?:\\d{2}:)?[0-5]\\d:[0-5]\\d(?:\\.\\d{3})?$';

// A single timestamp entry: arbitrary key-value metadata.
const TimeMapEntrySchemaInternal = T.Record(T.String(), T.Unknown(), {
  description: `Arbitrary key-value metadata for this time entry (e.g., { video?: string, name?: string, text?: string }).`,
});

// Root time map: timecode → entry record.
const TimeMapSchemaInternal = T.Record(
  T.String({
    pattern: WEBVTT_TIMESTAMP,
    description: 'Timestamp: MM:SS | HH:MM:SS | HH:MM:SS.mmm.',
  }),
  TimeMapEntrySchemaInternal,
  {
    $id: 'trait.time-map',
    title: 'Time Map',
    description: `Map of timestamp (MM:SS | HH:MM:SS | HH:MM:SS.mmm) → Record<string, unknown> (loose holding pattern).`,
    additionalProperties: false, // NB: Enforce key-pattern (no extra properties outside the pattern).
  },
);

export const TimeMapSchema: t.TSchema = TimeMapSchemaInternal;
