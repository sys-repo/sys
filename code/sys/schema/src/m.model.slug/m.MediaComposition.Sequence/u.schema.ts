import { V } from '../common.ts';

/**
 * Text block used inside timestamp entries and pause cards.
 */
const TimestampText = V.object(
  {
    headline: V.optional(V.string()),
    tagline: V.optional(V.string()),
    body: V.optional(V.string()),
  },
  {
    title: 'SequenceTimestampText',
    description: `Optional headline/tagline/body text used at a given timestamp or pause. If body text is present, a headline is required (enforced by the sequence validator).`,
  },
);

/**
 * Single timestamp entry keyed by a WebVTT timecode.
 *
 * Keys live in a Timecode.Map, so the timecode grammar is enforced by the
 * Timecode layer, not by this schema.
 */
const TimestampEntry = V.object(
  {
    pause: V.optional(V.string()), // e.g. "2s", "3s"
    title: V.optional(V.string()),
    image: V.optional(V.string()),
    text: V.optional(TimestampText),
  },
  {
    title: 'SequenceTimestampEntry',
    description: `Single timestamp entry keyed by a WebVTT timecode. When an image is present, body text is disallowed (enforced by the sequence validator).`,
  },
);

/**
 * String-keyed map of timecodes → timestamp entries.
 *
 * We deliberately do not constrain the key pattern here; the Timecode.Map
 * type already enforces the WebVTT grammar upstream.
 */
const Timestamps = V.record(TimestampEntry, {
  title: 'SequenceTimestamps',
  description: 'Map of WebVTT timecodes to timestamp entries.',
});

/**
 * Video item: core building block of the composite sequence.
 *
 * Title/script are optional at the YAML layer; later stages can impose
 * stricter requirements when mapping into the canonical composition spec.
 */
const VideoItem = V.object(
  {
    video: V.string(),
    title: V.optional(V.string()),
    script: V.optional(V.string()),
    slice: V.optional(
      V.string({
        description: `Time slice within the source media, e.g. "00:00:03..00:00:10" (Timecode.SliceString).`,
      }),
    ),
    timestamps: V.optional(Timestamps),
  },
  {
    title: 'SequenceVideoItem',
    description: 'Video segment: video source plus optional title/script/slice/timestamps.',
  },
);

/**
 * Slug item: injection of another slug into the sequence.
 *
 * Display mode defaults to "inline"; "overlay" is available for future
 * UI treatments.
 */
const SlugItem = V.object(
  {
    slug: V.string(),
    display: V.optional(V.union([V.literal('inline'), V.literal('overlay')])),
    timestamps: V.optional(Timestamps),
  },
  {
    title: 'SequenceSlugItem',
    description: 'Injection of another slug, optionally with its own timestamps.',
  },
);

/**
 * Pause item: simple pause, optionally with a title card and text.
 *
 * Covers both bare pauses and richer pause-with-text cases so the union
 * stays small and shape-based.
 */
const PauseItem = V.object(
  {
    pause: V.string(), // e.g. "2s" | "3s"
    title: V.optional(V.string()),
    text: V.optional(TimestampText),
  },
  {
    title: 'SequencePauseItem',
    description: 'Pause in playback, optionally with a title card and text.',
  },
);

/**
 * Image item: image marker with text driven by timestamps.
 */
const ImageItem = V.object(
  { image: V.string(), timestamps: Timestamps },
  {
    title: 'SequenceImageItem',
    description: 'Image segment whose overlays are driven by timestamp entries.',
  },
);

/**
 * Union of all sequence item shapes.
 */
const SequenceItem = V.union([VideoItem, SlugItem, PauseItem, ImageItem], {
  title: 'SequenceItem',
  description: 'Sequence item discriminated by shape (no explicit "kind" field).',
});

/**
 * Top-level Sequence recipe:
 * ordered list of items.
 */
export const SequenceList = V.array(SequenceItem, {
  title: 'Sequence',
  description: 'Complete ordered sequence of composite items for a slug.',
});
