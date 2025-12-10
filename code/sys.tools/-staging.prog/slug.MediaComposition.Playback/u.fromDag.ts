import { type t, Sequence } from './common.ts';

/**
 * Convenience: read + normalize into a playback spec ready
 * to be written as `slug.<docid>.playback.json`.
 */
export const fromDag: t.PlaybackLib['fromDag'] = async (dag, yamlPath, docid, opts) => {
  // 1. Load the authoring-time sequence for this slug.
  const sequence = await Sequence.fromDag(dag, yamlPath, docid, { ...opts });
  if (!sequence) return undefined;

  // 2. Normalize into the generic timecode model (composition + beats).
  const normalized = Sequence.Normalize.toTimecode(sequence, { docid, yamlPath });

  // 3. Project into the wire-format playback spec.
  return projectNormalizedToPlayback(docid, normalized);
};

/**
 * Internal helper: project a normalized SlugSequence into the
 * playback spec wire format used by bundler/UI.
 */
export function projectNormalizedToPlayback(
  docid: t.Crdt.Id,
  normalized: t.SlugSequenceNormalized,
): t.PlaybackSpec {
  const { timecode, beats, meta } = normalized;
  return {
    docid,
    composition: timecode,
    beats,
    meta,
  };
}
