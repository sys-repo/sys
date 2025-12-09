import type { t } from '../common.ts';

/**
 * Text block used inside timestamp entries and pause cards.
 */
export type SlugSequenceTimestampText = {
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
export type SlugSequenceTimestampEntry = {
  readonly pause?: string; // e.g. "2s", "3s"
  readonly title?: string;
  readonly image?: string;
  readonly text?: SlugSequenceTimestampText;
};

/**
 * Map of WebVTT timecodes → timestamp entries.
 * Reuses the canonical Timecode map type.
 */
export type SlugSequenceTimestamps = t.Timecode.Map<SlugSequenceTimestampEntry>;

/**
 * Video item: core building block of the composite sequence.
 *
 * Title/script/slice are optional at the authoring layer; the later
 * TimecodeCompositionSpec normalizer can enforce tighter rules.
 */
export type SlugSequenceVideoItem = {
  readonly video: string;
  readonly title?: string;
  readonly script?: string;
  readonly slice?: t.Timecode.SliceString;
  readonly timestamps?: SlugSequenceTimestamps;
};

/**
 * Slug item: injection of another slug into the sequence.
 *
 * Display defaults to "inline" when omitted; "overlay" is available for
 * specialised treatments (for example, overlay panels).
 */
export type SlugSequenceEmbedItem = {
  readonly slug: string;
  readonly display?: 'inline' | 'overlay';
  readonly timestamps?: SlugSequenceTimestamps;
};

/**
 * Pause item with optional title + rich text.
 * Covers both bare pauses and richer title-card pauses.
 */
export type SlugSequencePauseItem = {
  readonly pause: string; // e.g. "2s" | "3s"
  readonly title?: string;
  readonly text?: SlugSequenceTimestampText;
};

/**
 * Image marker with timed overlays (timestamps drive the text).
 */
export type SlugSequenceImageItem = {
  readonly image: t.StringRef;
  readonly timestamps: SlugSequenceTimestamps;
};

/**
 * Full union of sequence items.
 *
 * The canonical TimecodeCompositionSpec normalizer can later project from
 * this authoring-time union into the pure timecode pieces it needs.
 */
export type SlugSequenceItem =
  | SlugSequenceVideoItem
  | SlugSequenceEmbedItem
  | SlugSequencePauseItem
  | SlugSequenceImageItem;

/**
 * The complete sequence for a slug: ordered list of items.
 */
export type SlugSequence = readonly SlugSequenceItem[];
