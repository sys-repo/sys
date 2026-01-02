import React from 'react';
import { type t, Timecode } from './common.ts';
import type * as H from './t.hooks.ts';

const ix = (n: t.Index): t.TimecodeState.Playback.BeatIndex => n;
const segId = (segment: t.Index): t.StringId => `seg:${segment}`;

/**
 * Boundary projection: @sys/std Timecode.Playback.Spec → { resolved, experience, playback }.
 *
 * This hook is intentionally a "pure projection":
 * - no effects
 * - no runtime assumptions
 * - memoized derived data only
 */
export function usePlaybackTimeline<P = unknown>(
  args: H.UsePlaybackTimelineArgs<P>,
): H.UsePlaybackTimelineResult<P> {
  const { spec } = args;
  return React.useMemo<H.UsePlaybackTimelineResult<P>>(() => {
    if (!spec) return {};

    // 1) Resolve composite → segments + total + diagnostics.
    const resolved = Timecode.Composite.toVirtualTimeline(spec.composition);

    // 2) Project beats onto virtual time axis (std Experience timeline).
    const experience = Timecode.Experience.toTimeline<P>(resolved, spec.beats);

    // 3) Map std timeline → ui-state PlaybackTimeline (beats + segments).
    const beats: t.TimecodeState.Playback.Beat[] = experience.beats.map((b, i) => {
      const vTime = b.vTime;
      const next = experience.beats[i + 1];
      const totalSpanMs = next ? next.vTime - vTime : experience.duration - vTime;

      // ui-state beat.duration is the total span to next beat (or to end).
      const duration = Math.max(0, totalSpanMs);

      // Segment index derived from composite map at this beat's vTime.
      const map = Timecode.Composite.Map.toSource(resolved.segments, vTime);
      const segIndex = map?.index ?? 0;

      return {
        index: ix(i),
        vTime,
        duration,
        pause: b.pause,
        segmentId: segId(segIndex),

        // NOTE: We do not infer media hints here. Keep undefined rather than guess.
        media: undefined,
      };
    });

    // Segment ranges by grouping beats by segIndex (derived via Map.toSource).
    const ranges = new Map<number, { from: number; to: number }>();
    for (let i = 0; i < beats.length; i++) {
      const vTime = beats[i]!.vTime;
      const map = Timecode.Composite.Map.toSource(resolved.segments, vTime);
      const segIndex = map?.index ?? 0;

      const curr = ranges.get(segIndex);
      if (!curr) ranges.set(segIndex, { from: i, to: i + 1 });
      else curr.to = i + 1;
    }

    const segments: t.TimecodeState.Playback.Segment[] = [...ranges.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([segIndex, r]) => ({
        id: segId(segIndex),
        beat: { from: ix(r.from), to: ix(r.to) },
      }));

    const playback: t.TimecodeState.Playback.Timeline = {
      beats,
      segments,
      virtualDuration: resolved.total,
    };

    return { resolved, experience, playback };
  }, [spec]);
}
