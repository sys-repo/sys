import { type t, Type as T, Timecode } from '../common.ts';

// A single timestamp entry: arbitrary key-value metadata.
const TimestampEntrySchemaInternal = T.Record(T.String(), T.Unknown(), {
  description: `Arbitrary key-value metadata for this time entry (e.g., { video?: string, name?: string, text?: string }).`,
});

// Root time map: timecode → entry record.
const TimecodeMapSchemaInternal = T.Record(
  T.String({
    pattern: Timecode.pattern, // Timestamp (WebVTT-flex): allow MM:SS, HH:MM:SS, HH:MM:SS.mmm.
    description: 'Timestamp: MM:SS | HH:MM:SS | HH:MM:SS.mmm.',
  }),
  TimestampEntrySchemaInternal,
  {
    $id: 'trait.time-map',
    title: 'Time Map',
    description: `Map of timestamp (MM:SS | HH:MM:SS | HH:MM:SS.mmm) → Record<string, unknown> (loose holding pattern).`,
    additionalProperties: false, // NB: Enforce key-pattern (no extra properties outside the pattern).
  },
);

export const TimecodeMapSchema: t.TSchema = TimecodeMapSchemaInternal;
