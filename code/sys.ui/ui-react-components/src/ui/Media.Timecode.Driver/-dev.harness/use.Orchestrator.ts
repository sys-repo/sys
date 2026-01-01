import React from 'react';
import type { t } from './common.ts';

/**
 * Driver Harness Orchestrator (stub).
 *
 * 🌸
 * This file is intentionally a "dead shell" used to stand up the harness UI
 * awaiting completion of the driver parts.
 *
 * It will be brought to life by:
 * - buildPlaybackTimeline(...)
 * - usePlaybackDriver(...)
 * and then become glue-only, per the plan.
 */
export function useOrchestrator(
  _args: t.MediaTimeline.Orchestrator.Args,
): t.MediaTimeline.Orchestrator.Result {
  const controller = React.useMemo<t.TimelineController>(() => {
    return {
      init: () => {},
      play: () => {},
      pause: () => {},
      toggle: () => {},
      seekToBeat: () => {},
    };
  }, []);

  // NOTE: This is a temporary inert placeholder so the harness UI can compile/render.
  // It will be replaced with the reducer-derived snapshot once usePlaybackDriver exists.
  const snapshot = React.useMemo(() => {
    return undefined as unknown as t.PlaybackRunnerState;
  }, []);

  return {
    controller,
    snapshot,
    selectedIndex: 0 as t.TimecodeState.Playback.BeatIndex,
  };
}
