import type { t } from './common.ts';

export function playbackFromNormalized(
  docid: string,
  normalized: t.SequenceNormalized,
): t.SpecTimelineManifest {
  const { meta } = normalized;
  type B = t.Timecode.Playback.Beat<t.SequenceBeatPayload>;
  const beats: readonly B[] = normalized.beats.map((beat) => ({
    pause: beat.pause,
    payload: beat.payload,
    src: { kind: 'video', logicalPath: beat.src.ref, time: beat.src.time },
  }));

  const composition = normalized.timecode;
  return { docid, composition, beats, meta } as t.SpecTimelineManifest;
}
