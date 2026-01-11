import React from 'react';
import { type t, PlaybackDriver, TimecodeState } from './common.ts';

type Snapshot = t.TimecodeState.Playback.Snapshot;
type Controller = t.TimecodePlaybackDriver.TimelineController;

type Args = {
  docid?: t.StringId;
  bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  decks?: t.TimecodePlaybackDriver.VideoDecks;
  experience?: t.Timecode.Experience.Timeline;
  startBeat?: t.TimecodeState.Playback.BeatIndex;
  log?: boolean;
  onSnapshot?: (e: { readonly snapshot?: Snapshot }) => void;
};

type Result = {
  readonly controller: Controller;
  readonly snapshot?: Snapshot;
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
  const { bundle, decks, experience, startBeat, onSnapshot, log = false } = args;

  /** Derive initial ui-state from experience timeline. */
  const init = React.useMemo<t.TimecodeState.Playback.InitArgs | undefined>(() => {
    if (!bundle || !experience) return undefined;
    const timeline = TimecodeState.Playback.Util.buildTimeline(experience);
    return { timeline, startBeat };
  }, [bundle, experience, startBeat]);

  const resolveBeatMedia = React.useMemo<t.TimecodePlaybackDriver.ResolveBeatMedia>(() => {
    if (!bundle) return () => undefined;
    return PlaybackDriver.resolveBeatMedia(bundle);
  }, [bundle]);

  const { controller, snapshot } = PlaybackDriver.useDriver({
    init,
    decks,
    log,
    resolveBeatMedia,
    onSnapshot,
  });

  const index = snapshot?.state?.currentBeat;
  const beat = experience?.beats[index ?? -1];
  return {
    controller,
    snapshot,
    selected: index != null && beat ? { index, beat } : undefined,
  };
}
