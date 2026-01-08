import React from 'react';
import { type t, PlaybackDriver, TimecodeState } from './common.ts';

type Args = {
  bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  decks?: t.TimecodePlaybackDriver.VideoDecks;
  docid?: t.StringId;
  timeline?: t.Timecode.Experience.Timeline;
  startBeat?: t.TimecodeState.Playback.BeatIndex;
  log?: boolean;
};

type Result = {
  readonly controller: t.TimecodePlaybackDriver.TimelineController;
  readonly snapshot?: t.TimecodeState.Playback.Snapshot;
  readonly selected?: {
    readonly index: t.TimecodeState.Playback.BeatIndex;
    readonly beat: t.Timecode.Experience.Beat;
  };
};

/**
 * Harness Driver Orchestrator.
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
export function useOrchestrator(args: Args): Result {
  const { bundle, decks, timeline, startBeat, log = false } = args;

  /** Derive initial ui-state from experience timeline. */
  const init = React.useMemo<t.TimecodeState.Playback.InitArgs | undefined>(() => {
    if (!bundle || !timeline) return undefined;
    const playbackTimeline = TimecodeState.Playback.buildTimeline(timeline);
    return { timeline: playbackTimeline, startBeat };
  }, [bundle, timeline, startBeat]);

  const resolveBeatMedia = React.useMemo<t.TimecodePlaybackDriver.ResolveBeatMedia>(() => {
    if (!bundle) return () => undefined;
    return PlaybackDriver.resolveBeatMedia(bundle);
  }, [bundle]);

  const { controller, snapshot } = PlaybackDriver.useDriver({
    init,
    decks,
    log,
    resolveBeatMedia,
  });

  const index = snapshot?.state?.currentBeat;
  const beat = timeline?.beats[index ?? -1];
  return {
    controller,
    snapshot,
    selected: index != null && beat ? { index, beat } : undefined,
  };
}
