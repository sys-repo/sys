import React from 'react';
import { type t, Playback } from './common.ts';

type DeckId = t.TimecodeState.Playback.DeckId;

export function useOrchestrator(
  args: t.MediaTimeline.Orchestrator.Args,
): t.MediaTimeline.Orchestrator.Result {
  const { bundle, video, docid, timeline, startBeat = 0 } = args;

  const DEBUG = true;

  const dbg = React.useCallback((label: string, data?: unknown) => {
    if (!DEBUG) return;
    // Keep the label stable so logs group well.
    console.debug(`[Timecode.Playback] ${label}`, data ?? '');
  }, []);

  const dbgDeckProps = React.useCallback(
    (base: t.PlaybackRuntime, deck: DeckId) => {
      if (!DEBUG) return;

      const deckObj = base.decks?.get(deck);
      const props = deckObj?.props as unknown;

      // Keep this minimal and stable: only keys + any "slice" field if present.
      const keys =
        props && typeof props === 'object' && props !== null ? Object.keys(props as object) : [];

      const slice =
        props && typeof props === 'object' && props !== null && 'slice' in (props as object)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (props as any).slice
          : undefined;

      dbg('runtime.deck.props', { deck, hasDeck: deckObj ? true : false, keys: [...keys], slice });
    },
    [dbg],
  );

  /**
   * Playback runtime (imperative edge).
   */
  const runtime = React.useMemo<t.PlaybackRuntime>(() => {
    const base: t.PlaybackRuntime = !video
      ? Playback.runtime.noop()
      : Playback.runtime.fromVideoSignals(video);

    if (!DEBUG) return base;

    return {
      ...base,
      deck: {
        play: (deck) => {
          dbg('runtime.deck.play', { deck });
          base.deck.play?.(deck);
        },
        pause: (deck) => {
          dbg('runtime.deck.pause', { deck });
          console.trace('[Timecode.Playback] pause stack');
          base.deck.pause?.(deck);
        },
        seek: (deck, vTime) => {
          dbg('runtime.deck.seek', { deck, vTime });
          base.deck.seek?.(deck, vTime);

          // Log the deck props immediately after seek so we capture any slice/clamp state.
          dbgDeckProps(base, deck);
        },
      },
    };
  }, [video, dbg, dbgDeckProps]);

  /**
   * Playback runner (imperative, framework-free).
   * Owned by this hook.
   */
  const runner = React.useMemo<t.PlaybackRunner>(() => Playback.runner({ runtime }), [runtime]);
  const getRunner = React.useCallback(() => runner, [runner]);

  /**
   * Virtual-time progression (RAF + pause-window materialization).
   */
  Playback.useClock({ runtime, getRunner });

  /**
   * Runner lifecycle.
   */
  React.useEffect(() => () => void runner.dispose(), [runner]);

  /**
   * Snapshot subscription (React adapter).
   */
  const [snapshot, setSnapshot] = React.useState<t.PlaybackRunnerState>(() => runner.get());

  const lastTraceRef = React.useRef<
    | {
        readonly phase?: unknown;
        readonly intent?: unknown;
        readonly beat?: unknown;
        readonly active?: unknown;
      }
    | undefined
  >(undefined);

  const traceSnap = React.useCallback(
    (s: t.PlaybackRunnerState) => {
      if (!DEBUG) return;

      const next = {
        phase: s.state.phase,
        intent: s.state.intent,
        beat: s.state.currentBeat,
        active: s.state.decks.active,
      } as const;

      const prev = lastTraceRef.current;
      const changed =
        !prev ||
        prev.phase !== next.phase ||
        prev.intent !== next.intent ||
        prev.beat !== next.beat ||
        prev.active !== next.active;

      if (changed) {
        lastTraceRef.current = next;
        dbg('runner.state', { ...next, vTime: s.state.vTime });
      }
    },
    [dbg],
  );

  React.useEffect(() => {
    setSnapshot(runner.get());
    traceSnap(runner.get());

    const unsubscribe = runner.subscribe((next) => {
      traceSnap(next);
      setSnapshot(next);
    });

    return () => unsubscribe();
  }, [runner, traceSnap]);

  /**
   * Controller (runner-bound).
   */
  const controller = React.useMemo<t.TimelineController>(() => {
    return Playback.controller.timeline(runner);
  }, [runner]);

  /**
   * Build the ui-state Playback.Timeline model from harness inputs.
   */
  const playbackTimeline = React.useMemo<t.TimecodeState.Playback.Timeline | undefined>(() => {
    if (!timeline || !bundle) return undefined;

    const beats = timeline.beats.map((beat, index) => {
      const next = timeline.beats[index + 1];
      const duration = next ? next.vTime - beat.vTime : timeline.duration - beat.vTime;

      const url = bundle.resolveMedia({
        kind: 'video',
        logicalPath: beat.src.ref,
      });

      return {
        index: index as t.TimecodeState.Playback.BeatIndex,
        vTime: beat.vTime,
        duration,
        pause: beat.pause,
        segmentId: beat.src.ref,
        media: { url, label: beat.src.ref.split('/').pop() ?? beat.src.ref },
      };
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
    dbg('controller.init', { docid, startBeat, beats: playbackTimeline.beats.length });
    controller.init(playbackTimeline, startBeat);
  }, [controller, playbackTimeline, docid, startBeat, dbg]);

  return {
    controller,
    snapshot,
    selectedIndex: snapshot.currentBeat,
  };
}
