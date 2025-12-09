import type { t } from './common.ts';

/**
 * Build an experience timeline from a resolved composition and a set of beats.
 *
 * - Beats are first mapped into the composite virtual axis via their
 *   (src.ref, src.time) coordinates.
 * - Beats that do not fall inside any segment are ignored.
 * - Beats are then ordered by base virtual time and re-based to include
 *   accumulated semantic pauses.
 */
export function toTimeline<P>(
  resolved: t.TimecodeCompositionResolved,
  beats: readonly t.TimecodeExperienceBeat<P>[],
): t.TimecodeTimeline<P> {
  const { segments, total } = resolved;

  if (segments.length === 0 || beats.length === 0) {
    return { beats: [], duration: total };
  }

  type Entry = {
    readonly base: t.Msecs;
    readonly beat: t.TimecodeExperienceBeat<P>;
  };

  const entries: Entry[] = [];

  for (const beat of beats) {
    const seg = findSegmentForBeat(segments, beat.src.ref, beat.src.time);
    if (!seg) continue;

    const offset = (beat.src.time - seg.original.from) as t.Msecs;
    const base = (seg.virtual.from + offset) as t.Msecs;
    entries.push({ base, beat });
  }

  if (entries.length === 0) {
    return { beats: [], duration: total };
  }

  // Sort beats by their base virtual time.
  entries.sort((a, b) => Number(a.base) - Number(b.base));

  const timelineBeats: t.TimecodeTimelineBeat<P>[] = [];
  let accumulatedPause = 0 as t.Msecs;

  for (const { base, beat } of entries) {
    const vTime = (base + accumulatedPause) as t.Msecs;

    timelineBeats.push({
      ...beat,
      src: { ...beat.src },
      vTime,
    });

    if (beat.pause && beat.pause > 0) {
      accumulatedPause = (accumulatedPause + beat.pause) as t.Msecs;
    }
  }

  const duration = (total + accumulatedPause) as t.Msecs;
  return { beats: timelineBeats, duration };
}

/**
 * Locate the segment that contains the given source ref/time.
 */
function findSegmentForBeat(
  segments: readonly t.TimecodeResolvedSegment[],
  ref: t.StringRef,
  time: t.Msecs,
): t.TimecodeResolvedSegment | undefined {
  for (const seg of segments) {
    if (seg.src !== ref) continue;
    if (time < seg.original.from) continue;
    if (time >= seg.original.to) continue;
    return seg;
  }
  return undefined;
}
