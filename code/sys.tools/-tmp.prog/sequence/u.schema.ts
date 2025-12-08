import { type t, V } from '../common.ts';

/**
 * SequenceTimestampText recipe.
 */
const TimestampText = V.object(
  {
    headline: V.optional(V.string()),
    tagline: V.optional(V.string()),
    body: V.optional(V.string()),
  },
  {
    title: 'SequenceTimestampText',
    description: 'Optional headline/tagline/body text used at a given timestamp.',
  },
);

/**
 * SequenceTimestampEntry recipe.
 *
 * Keys live in a Timecode.Map, so the actual timecode grammar is enforced
 * by the Timecode layer, not by this schema.
 */
const TimestampEntry = V.object(
  {
    pause: V.optional(V.string()), // "2s", "3s"
    title: V.optional(V.string()),
    image: V.optional(V.string()),
    text: V.optional(TimestampText),
  },
  {
    title: 'SequenceTimestampEntry',
    description: 'Single timestamp entry keyed by a WebVTT timecode.',
  },
);

/**
 * SequenceTimestamps recipe:
 * string-keyed map of timecodes → entries.
 *
 * We deliberately do NOT constrain the key pattern here; the Timecode.Map
 * type already enforces the WebVTT grammar upstream.
 */
const Timestamps = V.record(TimestampEntry, {
  title: 'SequenceTimestamps',
  description: 'Map of WebVTT timecodes to timestamp entries.',
});

/**
 * SequenceVideoItem recipe.
 */
const VideoItem = V.object(
  {
    video: V.string(),
    script: V.string(),
    slice: V.optional(
      V.string({
        description:
          'Time slice within the source media, e.g. "00:00:03..00:00:10" (Timecode.SliceString).',
      }),
    ),
    timestamps: V.optional(Timestamps),
  },
  {
    title: 'SequenceVideoItem',
    description:
      'Video segment: core building block of the composite sequence (video+script+optional slice/timestamps).',
  },
);

/**
 * SequenceSlugItem recipe.
 */
const SlugItem = V.object(
  {
    slug: V.string(),
    display: V.literal('inline'),
    timestamps: V.optional(Timestamps),
  },
  {
    title: 'SequenceSlugItem',
    description: 'Inline injection of another slug into the sequence.',
  },
);

/**
 * SequencePauseTextItem recipe.
 */
const PauseTextItem = V.object(
  {
    pause: V.string(), // "2s" | "3s"
    title: V.string(),
    text: V.object({
      body: V.string(),
    }),
  },
  {
    title: 'SequencePauseTextItem',
    description: 'Pause with a title card and body text.',
  },
);

/**
 * SequencePauseItem recipe.
 */
const PauseItem = V.object(
  {
    pause: V.string(),
  },
  {
    title: 'SequencePauseItem',
    description: 'Simple pause item with no text.',
  },
);

/**
 * SequenceImageItem recipe.
 */
const ImageItem = V.object(
  {
    image: V.string(),
    timestamps: Timestamps,
  },
  {
    title: 'SequenceImageItem',
    description: 'Image marker with text driven by timestamps.',
  },
);

/**
 * Union of all sequence item shapes.
 */
const SequenceItem = V.union([VideoItem, SlugItem, PauseItem, PauseTextItem, ImageItem], {
  title: 'SequenceItem',
  description: 'Discriminated at the shape level (no explicit "kind" field in current docs).',
});

/**
 * Top-level Sequence recipe:
 * ordered list of items.
 */
export const SequenceRecipe = V.array(SequenceItem, {
  title: 'Sequence',
  description: 'Complete ordered sequence of composite items for a slug.',
});
