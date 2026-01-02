import React from 'react';
import type { t } from './common.ts';

type Args = {
  readonly bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  readonly video?: t.VideoDeckRuntimeArgs;
  readonly docid?: t.StringId;
  readonly timeline?: t.Timecode.Experience.Timeline;
  readonly startBeat?: t.TimecodeState.Playback.BeatIndex;
};

type Result = {
  readonly controller: t.TimecodePlaybackDriver.TimelineController;
  readonly snapshot?: t.TimecodeState.Playback.Update;
  readonly selectedIndex?: t.TimecodeState.Playback.BeatIndex;
};

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
export function useOrchestrator(_args: Args): Result {
  const controller = React.useMemo<t.TimecodePlaybackDriver.TimelineController>(() => {
    return {
      init: (_args) => {},
      play: () => {},
      pause: () => {},
      toggle: () => {},
      seekToBeat: () => {},
    };
  }, []);

  // NOTE: This is a temporary inert placeholder so the harness UI can compile/render.
  // It will be replaced with the reducer-derived snapshot once usePlaybackDriver is employed.
  const snapshot = undefined as t.TimecodeState.Playback.Update | undefined;
  const selectedIndex = snapshot?.state?.currentBeat;

  return {
    controller,
    snapshot,
    selectedIndex,
  };
}
