import React from 'react';
import { type t, Timecode } from './common.ts';

/**
 * Derives a fully-resolved virtual timeline from a playback spec.
 *
 * Steps:
 * 1. Resolve the composite definition into a linear virtual timeline.
 * 2. Project beats onto that timeline, enriching them with vTime and durations.
 */
export const useTimeline = <P = unknown>(
  spec?: t.Timecode.Playback.Spec<P>,
): t.MediaTimeline.Timeline.Result<P> => {
  return React.useMemo<t.MediaTimeline.Timeline.Result<P>>(() => {
    if (!spec) return {};

    // 1. Resolve composite → segments + total + diagnostics.
    const resolved = Timecode.Composite.toVirtualTimeline(spec.composition);

    // 2. Project beats onto the virtual timeline (adds vTime, duration).
    const beatsForTimeline: readonly t.Timecode.Experience.Beat<P>[] = spec.beats.map((beat) => ({
      src: { ref: beat.src.logicalPath, time: beat.src.time },
      pause: beat.pause,
      payload: beat.payload,
    }));

    const timeline = Timecode.Experience.toTimeline<P>(resolved, beatsForTimeline);

    return { resolved, timeline };
  }, [spec]);
};
