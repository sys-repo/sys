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
): t.UseMediaTimelineResult<P> => {
  return React.useMemo<t.UseMediaTimelineResult<P>>(() => {
    if (!spec) return {};

    // 1. Resolve composite → segments + total + diagnostics.
    const resolved = Timecode.Composite.toVirtualTimeline(spec.composition);

    // 2. Project beats onto the virtual timeline (adds vTime, duration).
    const timeline = Timecode.Experience.toTimeline<P>(resolved, spec.beats);

    return { resolved, timeline };
  }, [spec]);
};
