import type { t } from './common.ts';

/**
 * Text block used inside timestamp entries and pause cards.
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
 * Title/script/slice are optional at the authoring layer; the later
 * TimecodeCompositionSpec normalizer can enforce tighter rules.
 */
export type SequenceVideoItem = {
  readonly video: string;
  readonly title?: string;
  readonly script?: string;
  readonly slice?: t.Timecode.Slice.String;
  readonly timestamps?: SequenceTimestamps;
};

/**
 * Slug item: injection of another slug into the sequence.
 *
 * Display defaults to "inline" when omitted; "overlay" is available for
 * specialised treatments (for example, overlay panels).
 */
export type SequenceEmbedItem = {
  readonly slug: string;
  readonly display?: 'inline' | 'overlay';
  readonly timestamps?: SequenceTimestamps;
};

/**
 * Pause item with optional title + rich text.
 * Covers both bare pauses and richer title-card pauses.
 */
export type SequencePauseItem = {
  readonly pause: string; // e.g. "2s" | "3s"
  readonly title?: string;
  readonly text?: SequenceTimestampText;
};

/**
 * Image marker with timed overlays (timestamps drive the text).
 */
export type SequenceImageItem = {
  readonly image: t.StringRef;
  readonly timestamps: SequenceTimestamps;
};

/**
 * Full union of sequence items.
 *
 * The canonical TimecodeCompositionSpec normalizer can later project from
 * this authoring-time union into the pure timecode pieces it needs.
 */
export type SequenceItem =
  | SequenceVideoItem
  | SequenceEmbedItem
  | SequencePauseItem
  | SequenceImageItem;
