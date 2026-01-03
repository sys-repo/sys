import React from 'react';
import type { HarnessProps } from './t.ts';

import { type t, PlaybackDriver } from './common.ts';
import { Layout } from './ui.Layout.tsx';
import { useOrchestrator } from './use.Orchestrator.ts';

type TimelineController = t.TimecodePlaybackDriver.TimelineController;

export const Harness: React.FC<HarnessProps> = (props) => {
  const { debug = false, bundle, docid, video } = props;
  const spec = bundle?.spec;
  const hasBundle = !!bundle;

  /**
   * Timeline data (pure).
   */
  const { playback, experience } = PlaybackDriver.usePlaybackTimeline({ spec });

  /**
   * Keep onReady stable (avoid render-feedback loops).
   */
  const onReadyRef = React.useRef(props.onReady);
  React.useEffect(() => void (onReadyRef.current = props.onReady), [props.onReady]);

  /**
   * Dev-only orchestration glue:
   * runtime → runner → snapshot → controller → init sequencing.
   */
  const { controller, snapshot, selectedIndex } = useOrchestrator({
    bundle,
    video,
    docid,
    experience,
    startBeat: 0,
  });

  /**
   * UI-only derived values.
   */
  const beat = selectedIndex != null && experience ? experience.beats[selectedIndex] : undefined;

  /**
   * Active phase of the selected beat derived from authoritative vTime.
   * - 'pause' iff vTime lies inside the pause tail
   * - else 'media'
   * - null when inputs are missing
   */
  const activePhase = React.useMemo((): 'media' | 'pause' | null => {
    if (!playback || !snapshot) return null;
    if (selectedIndex == null) return null;

    const vTime = snapshot.state.vTime;
    if (vTime == null) return null;

    const b = playback.beats[selectedIndex];
    if (!b) return null;

    const next = playback.beats[selectedIndex + 1];
    const totalSpanMs = next ? next.vTime - b.vTime : playback.virtualDuration - b.vTime;

    const pauseMs = b.pause ?? 0;
    const mediaSpanMs = Math.max(0, totalSpanMs - pauseMs);

    const pauseFrom = b.vTime + mediaSpanMs;
    const pauseTo = pauseFrom + pauseMs;

    if (pauseMs > 0 && vTime >= pauseFrom && vTime < pauseTo) return 'pause';
    return 'media';
  }, [snapshot?.state.vTime, playback, selectedIndex]);

  /**
   * Fire onReady once per controller instance.
   */
  const lastControllerRef = React.useRef<TimelineController | undefined>(undefined);
  React.useEffect(() => {
    if (!onReadyRef.current) return;
    if (lastControllerRef.current === controller) return;
    lastControllerRef.current = controller;
    onReadyRef.current({ controller });
  }, [controller]);

  /**
   * Render
   */
  return (
    <Layout
      hasBundle={hasBundle}
      debug={debug}
      beat={beat}
      docid={docid}
      video={video}
      bundle={bundle}
      layout={props.layout}
      theme={props.theme}
      style={props.style}
      selectedIndex={selectedIndex}
      activePhase={activePhase}
      onSelectIndex={(e) => controller.seekToBeat(e.index)}
    />
  );
};
