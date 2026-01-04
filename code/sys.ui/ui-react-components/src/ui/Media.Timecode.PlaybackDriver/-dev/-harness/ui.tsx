import React from 'react';
import type { HarnessProps } from './t.ts';

import { type t, PlaybackDriver } from './common.ts';
import { Layout } from './ui.Layout.tsx';
import { useOrchestrator } from './use.Orchestrator.ts';

type TimelineController = t.TimecodePlaybackDriver.TimelineController;

export const Harness: React.FC<HarnessProps> = (props) => {
  const { debug = false, bundle, docid, decks } = props;
  const spec = bundle?.spec;
  const hasBundle = !!bundle;

  /**
   * Timeline data (pure).
   */
  const timeline = PlaybackDriver.usePlaybackTimeline({ spec });
  const { experience } = timeline;

  /**
   * Keep onReady stable (avoid render-feedback loops).
   */
  const onReadyRef = React.useRef(props.onReady);
  React.useEffect(() => void (onReadyRef.current = props.onReady), [props.onReady]);

  /**
   * Dev-only orchestration glue:
   * runtime → runner → snapshot → controller → init sequencing.
   */
  const orchestrator = useOrchestrator({ bundle, decks, docid, experience, startBeat: 0 });

  /**
   * UI-only derived values.
   */
  const beat =
    orchestrator.selectedIndex != null && experience
      ? experience.beats[orchestrator.selectedIndex]
      : undefined;

  /**
   * Active phase of the selected beat derived from authoritative vTime.
   * - 'pause' iff vTime lies inside the pause tail
   * - else 'media'
   * - null when inputs are missing
   */
  const activePhase = React.useMemo((): 'media' | 'pause' | null => {
    if (!timeline.playback || !orchestrator.snapshot) return null;
    if (orchestrator.selectedIndex == null) return null;

    const vTime = orchestrator.snapshot.state.vTime;
    if (vTime == null) return null;

    const b = timeline.playback.beats[orchestrator.selectedIndex];
    if (!b) return null;

    const next = timeline.playback.beats[orchestrator.selectedIndex + 1];
    const totalSpanMs = next ? next.vTime - b.vTime : timeline.playback.virtualDuration - b.vTime;

    const pauseMs = b.pause ?? 0;
    const mediaSpanMs = Math.max(0, totalSpanMs - pauseMs);

    const pauseFrom = b.vTime + mediaSpanMs;
    const pauseTo = pauseFrom + pauseMs;

    if (pauseMs > 0 && vTime >= pauseFrom && vTime < pauseTo) return 'pause';
    return 'media';
  }, [orchestrator.snapshot?.state.vTime, timeline.playback, orchestrator.selectedIndex]);

  /**
   * Fire onReady once per controller instance.
   */
  const lastControllerRef = React.useRef<TimelineController | undefined>(undefined);
  React.useEffect(() => {
    const { controller } = orchestrator;

    if (!onReadyRef.current) return;
    if (lastControllerRef.current === controller) return;

    lastControllerRef.current = controller;
    onReadyRef.current({ controller });
  }, [orchestrator.controller]);

  /**
   * Render
   */
  return (
    <Layout
      hasBundle={hasBundle}
      debug={debug}
      beat={beat}
      docid={docid}
      decks={decks}
      bundle={bundle}
      layout={props.layout}
      theme={props.theme}
      style={props.style}
      selectedIndex={orchestrator.selectedIndex}
      activePhase={activePhase}
      onSelectIndex={(e) => orchestrator.controller.seekToBeat(e.index)}
    />
  );
};
