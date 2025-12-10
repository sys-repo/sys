import type { t } from './common.ts';

/**
 * Payload attached to each beat extracted from the YAML `timestamps` map.
 *
 * Purely UI/overlay metadata local to the sequence domain.
 * The timecode-experience layer treats this as opaque payload `P`.
 */
export type SequenceBeatPayload = {
  readonly title?: string;
  readonly image?: string;
  readonly text?: t.SequenceTimestampText;
};

/**
 * A timestamp-derived beat tied to a concrete (src.ref, src.time) point.
 *
 * Structural timeline mapping is owned by `TimecodeExperienceBeat<P>`;
 * this layer only fixes the payload shape used by the sequence domain.
 */
export type SequenceBeat = t.TimecodeExperienceBeat<SequenceBeatPayload>;

/**
 * Normalized result of lowering the YAML DSL to a timecode `Sequence`.
 *
 * - `timecode`: structural media composition (segments/slices only).
 * - `beats`: UI/overlay events aligned to *source media time*.
 * - `meta`: optional provenance; has no playback semantics.
 */
export type SequenceNormalized = {
  readonly timecode: t.TimecodeCompositionSpec;
  readonly beats: readonly SequenceBeat[];
  readonly meta?: {
    readonly docid?: t.Crdt.Id;
    readonly path?: { yaml: t.ObjectPath };
  };
};
