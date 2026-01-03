import React from 'react';
import type { t } from './common.ts';

type Args = {
  readonly bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  readonly video?: t.TimecodePlaybackDriver.VideoDecks;
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
 * - Bind PlaybackDriver lifecycle to React
 * - Forward controller intents to the driver
 * - Surface reducer snapshots for inspection
 *
 * Non-responsibilities:
 * - No playback logic
 * - No state derivation
 * - No media resolution or scheduling
 *
 * This file exists purely to adapt imperative driver behavior
 * to declarative UI surfaces.
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

  const snapshot = undefined as t.TimecodeState.Playback.Update | undefined;
  const selectedIndex = snapshot?.state?.currentBeat;

  return {
    controller,
    snapshot,
    selectedIndex,
  };
}
