import { type t, Sequence } from './common.ts';

/**
 * Convenience: read + normalize into a playback spec ready
 * to be written as `slug.<docid>.playback.json`.
 */
export const fromDag: t.PlaybackLib['fromDag'] = async (dag, yamlPath, docid, opts) => {
  // 1. Load the authoring-time sequence for this slug (with structured result).
  const result = await Sequence.fromDag(dag, yamlPath, docid, { ...opts });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
    };
  }

  // 2. Normalize into the generic timecode model (composition + beats).
  const normalized = Sequence.Normalize.toTimecode(result.sequence, { docid, yamlPath });

  // 3. Project into the wire-format playback spec.
  const playback = projectNormalizedToPlayback(docid, normalized);

  return {
    ok: true,
    sequence: playback,
  };
};

/**
 * Internal helper: project a normalized SlugSequence into the
 * playback spec wire format used by bundler/UI.
 */
export function projectNormalizedToPlayback(
  docid: t.Crdt.Id,
  normalized: t.SequenceNormalized,
): t.PlaybackSpec {
  const { timecode, beats, meta } = normalized;
  return {
    docid,
    composition: timecode,
    beats,
    meta,
  };
}
