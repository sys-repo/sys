import React from 'react';
import { type t, Playback } from './common.ts';

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
