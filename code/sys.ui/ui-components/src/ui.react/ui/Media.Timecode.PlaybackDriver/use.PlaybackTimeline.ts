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

    // 2) Adapt runtime playback beats → experience beats for timeline mapping.
    //    (Experience mapping requires `src.ref` to match composition pieces.)
    const expBeats: readonly t.Timecode.Experience.Beat<P>[] = spec.beats.map((b) => ({
      pause: b.pause,
      payload: b.payload,
      src: { ref: b.src.logicalPath, time: b.src.time },
    }));

    // 3) Project beats onto virtual time axis (std Experience timeline).
    const experience = Timecode.Experience.toTimeline<P>(resolved, expBeats);

    const sourceRef = (() => {
      const count = new Map<t.StringPath, number>();
      const index = new Map<t.StringPath, number>();
      spec.composition.forEach((item, i) => {
        const src = String(item.src) as t.StringPath;
        count.set(src, (count.get(src) ?? 0) + 1);
        if (!index.has(src)) index.set(src, i);
      });
      return { count, index };
    })();

    const toSegmentIndex = (beatIndex: t.Index, vTime: t.Msecs): t.Index => {
      const byTime = Timecode.Composite.Map.toSource(resolved.segments, vTime)?.index ?? 0;
      const byTimeSrc = String(spec.composition[byTime]?.src ?? '');
      const logicalPath = String(spec.beats[beatIndex]?.src.logicalPath ?? '');
      if (!logicalPath) return byTime;
      if (byTimeSrc === logicalPath) return byTime;

      const count = sourceRef.count.get(logicalPath) ?? 0;
      if (count === 1) return sourceRef.index.get(logicalPath) ?? byTime;
      return byTime;
    };

    // 4) Map std timeline → ui-state PlaybackTimeline (beats + segments).
    const beats: t.TimecodeState.Playback.Beat[] = experience.beats.map((b, i) => {
      const vTime = b.vTime;
      const next = experience.beats[i + 1];
      const totalSpanMs = next ? next.vTime - vTime : experience.duration - vTime;

      // ui-state beat.duration is the total span to next beat (or to end).
      const duration = Math.max(0, totalSpanMs);

      // Segment identity: source-aware primary mapping with virtual-time fallback.
      const segIndex = toSegmentIndex(i, vTime);

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

    // Segment ranges by grouping beats by resolved segment-id.
    const ranges = new Map<number, { from: number; to: number }>();
    for (let i = 0; i < beats.length; i++) {
      const segIdValue = beats[i]!.segmentId;
      const segIndex = Number(segIdValue.replace(/^seg:/, ''));

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
