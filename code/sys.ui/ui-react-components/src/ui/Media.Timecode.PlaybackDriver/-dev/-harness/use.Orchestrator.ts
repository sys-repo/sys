import React from 'react';
import type { t } from './common.ts';

type Args = {
  readonly bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  readonly video?: t.VideoDeckRuntimeArgs;
  readonly docid?: t.StringId;
  readonly playback?: t.TimecodeState.Playback.Timeline;
  readonly startBeat?: t.TimecodeState.Playback.BeatIndex;
};

type Result = {
  readonly controller: t.TimecodePlaybackDriver.TimelineController;
  readonly snapshot?: t.TimecodeState.Playback.Update;
  readonly selectedIndex?: t.TimecodeState.Playback.BeatIndex;
};

/**
 * Driver Harness Orchestrator.
 *
 * Glue layer between the PlaybackDriver and the harness UI.
 *
 * Responsibilities:
 * - Accepts pure playback timeline + bundle/runtime inputs
 * - Wires the driver lifecycle to React
 * - Exposes controller, snapshot, and selected index for UI consumption
 *
 * This layer contains no playback logic; it only binds stateful driver
 * behavior to declarative UI surfaces.
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
