import React from 'react';
import { type t, Playback } from './common.ts';

import { usePlaybackClock } from '../../Media.Timecode.Playback/mod.ts';

/**
 * Orchestrator hook (staging layer).
 *
 * This module is intentionally a "wiring bay" used during convergence:
 * it binds together:
 * - std-layer timecode resolution (pure)
 * - ui-state playback machine (pure)
 * - runtime adapters (imperative edge)
 * - React subscription + controller surfaces (UI)
 *
 * IMPORTANT:
 * This is not the final architecture boundary.
 * Once the end-to-end slice is stable, the wiring done here should be
 * extracted into dedicated modules at the correct layer (std / ui-state /
 * ui-react-components), leaving this file minimal or removing it entirely.
 *
 * Design intent:
 * - Keep all glue explicit and localized (so it is easy to delete later).
 * - Avoid duplicating std semantics: if logic here starts re-implementing
 *   mapping/clock behavior, that is a refactor trigger.
 */
export function useOrchestrator(
  args: t.MediaTimeline.Orchestrator.Args,
): t.MediaTimeline.Orchestrator.Result {
  const { bundle, video, docid, timeline, startBeat = 0 } = args;

  /**
   * Playback runtime (imperative edge).
   */
  const runtime = React.useMemo<t.PlaybackRuntime>(() => {
    if (!video) return Playback.runtime.noop();
    return Playback.runtime.fromVideoSignals(video);
  }, [video]);

  /**
   * Playback runner (imperative, framework-free).
   * Owned by this hook.
   */
  const runner = React.useMemo<t.PlaybackRunner>(() => Playback.runner({ runtime }), [runtime]);
  const getRunner = React.useCallback(() => runner, [runner]);
  usePlaybackClock({ runtime, getRunner });

  /**
   * Runner lifecycle.
   */
  React.useEffect(() => {
    return () => runner.dispose();
  }, [runner]);

  /**
   * Snapshot subscription (React adapter).
   */
  const [snapshot, setSnapshot] = React.useState<t.PlaybackRunnerState>(() => runner.get());

  React.useEffect(() => {
    setSnapshot(runner.get());
    const unsubscribe = runner.subscribe((next) => setSnapshot(next));
    return () => unsubscribe();
  }, [runner]);

  /**
   * Controller (runner-bound).
   */
  const controller = React.useMemo<t.TimelineController>(() => {
    return Playback.controller.timeline(runner);
  }, [runner]);

  /**
   * Build Playback timeline model (temporary adapter).
   */
  const playbackTimeline = React.useMemo<t.TimecodeState.Playback.Timeline | undefined>(() => {
    if (!timeline || !bundle) return undefined;

    const beats = timeline.beats.map((beat, index) => {
      const next = timeline.beats[index + 1];
      const duration = next ? next.vTime - beat.vTime : timeline.duration - beat.vTime;

      const url = bundle.resolveMedia({ kind: 'video', logicalPath: beat.src.ref });

      return {
        index: index as t.TimecodeState.Playback.BeatIndex,
        vTime: beat.vTime,
        duration,
        pause: beat.pause,
        segmentId: beat.src.ref,
        media: { url, label: beat.src.ref.split('/').pop() ?? beat.src.ref },
      } as const;
    });

    return {
      beats,
      segments: [],
      virtualDuration: timeline.duration,
    };
  }, [timeline, bundle]);

  /**
   * Init playback when the derived playback timeline changes.
   */
  React.useEffect(() => {
    if (!playbackTimeline) return;
    controller.init(playbackTimeline, startBeat);
  }, [controller, playbackTimeline, docid, startBeat]);

  return {
    controller,
    snapshot,
    selectedIndex: snapshot.currentBeat,
  };
}
