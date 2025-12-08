import type { t } from '../common.ts';

/**
 * Text block used inside timestamp entries.
 */
export type SequenceTimestampText = {
  readonly headline?: string;
  readonly tagline?: string;
  readonly body?: string;
};

/**
 * Single timestamp entry keyed by a timecode like "00:00:03".
 *
 * Keys live in a Timecode.Map, so the timecode grammar is enforced by the
 * Timecode layer, not by this shape.
 */
export type SequenceTimestampEntry = {
  readonly pause?: string; // e.g. "2s", "3s"
  readonly title?: string;
  readonly image?: string;
  readonly text?: SequenceTimestampText;
};

/**
 * Map of WebVTT timecodes → timestamp entries.
 * Reuses the canonical Timecode map type.
 */
export type SequenceTimestamps = t.Timecode.Map<SequenceTimestampEntry>;

/**
 * Video item: core building block of the composite sequence.
 *
 * NOTE:
 * - All current docs have `timestamps`, so this is conceptually required,
 *   but we keep it optional for authoring flexibility.
 * - `slice` is present on most, but not all, video items.
 */
export type SequenceVideoItem = {
  readonly video: string;
  readonly script: string;

  /**
   * Time slice within the source media: "<from>..<to>".
   * Semantics: Timecode.SliceString (WebVTT-based).
   *
   * You can tighten this later to `t.Timecode.SliceString` once the
   * extraction pipeline canonicalises / brands slices.
   */
  readonly slice?: string; // effectively a Timecode.SliceString

  readonly timestamps?: SequenceTimestamps;
};

/**
 * Slug item: inline injection of another slug.
 * In current data, display is always "inline".
 */
export type SequenceSlugItem = {
  readonly slug: string;
  readonly display: 'inline';
  readonly timestamps?: SequenceTimestamps; // used once, but real
};

/**
 * Pause item with a title + text.
 * Used for interstitial title cards / framing moments.
 */
export type SequencePauseTextItem = {
  readonly pause: string; // "2s" | "3s"
  readonly title: string;
  readonly text: {
    readonly body: string;
  };
};

/**
 * Simple pause item with no text.
 */
export type SequencePauseItem = {
  readonly pause: string;
};

/**
 * Image marker with timed overlays (timestamps drive the text).
 */
export type SequenceImageItem = {
  readonly image: string;
  readonly timestamps: SequenceTimestamps;
};

/**
 * Full union of all observed sequence items across the DAG.
 */
export type SequenceItem =
  | SequenceVideoItem
  | SequenceSlugItem
  | SequencePauseItem
  | SequencePauseTextItem
  | SequenceImageItem;

/**
 * The complete sequence for a slug: ordered list of items.
 */
export type Sequence = readonly SequenceItem[];
