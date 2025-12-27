import React from 'react';

import { useTimeline } from '../use.Timeline.ts';
import { type t } from './common.ts';
import { Layout } from './ui.Layout.tsx';
import { useOrchestrator } from './use.Orchestrator.ts';

/**
 * Component:
 */
export type HarnessProps = {
  debug?: boolean;
  video?: { A: t.VideoPlayerSignals; B: t.VideoPlayerSignals };
  bundle?: t.SpecTimelineBundle;
  docid?: t.StringId;
  layout?: { infopanel?: { bottom?: t.ReactNode } };
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onReady?: (e: { readonly controller: t.TimelineController }) => void;
};

export const Harness: React.FC<HarnessProps> = (props) => {
  const { debug = false, bundle, docid, video } = props;
  const hasBundle = !!bundle;

  /**
   * Timeline data (pure).
   */
  const { timeline } = useTimeline(bundle?.spec);

  /**
   * Keep onReady stable (avoid render-feedback loops).
   */
  const onReadyRef = React.useRef(props.onReady);
  React.useEffect(() => {
    onReadyRef.current = props.onReady;
  }, [props.onReady]);

  /**
   * Dev-only orchestration glue:
   * runtime → runner → snapshot → controller → init sequencing.
   */
  const { controller, snapshot, selectedIndex } = useOrchestrator({
    bundle,
    video,
    docid,
    timeline,
    startBeat: 0,
  });
  const beat = selectedIndex != null && timeline ? timeline.beats[selectedIndex] : undefined;

  /**
   * Fire onReady once per controller instance.
   */
  const lastControllerRef = React.useRef<t.TimelineController | undefined>(undefined);
  React.useEffect(() => {
    if (!onReadyRef.current) return;
    if (lastControllerRef.current === controller) return;
    lastControllerRef.current = controller;
    onReadyRef.current({ controller });
  }, [controller]);

  /**
   * Derive which portion of the selected beat is active based on `vTime`.
   * - Beats span [beat.vTime → nextBeat.vTime)
   * - Optional `pause` is a tail segment at the end of that span
   * - Returns 'pause' iff vTime lies inside the pause tail, else 'media'
   * - Returns null when timeline, selection, or vTime is unavailable
   *
   * UI-only derivation; does not affect playback state.
   */
  const activePhase = React.useMemo((): 'media' | 'pause' | null => {
    if (!timeline) return null;
    if (selectedIndex == null) return null;

    const vTime = snapshot.state.vTime;
    if (vTime == null) return null;

    const b = timeline.beats[selectedIndex];
    if (!b) return null;

    const next = timeline.beats[selectedIndex + 1];
    const totalSpanMs = next ? next.vTime - b.vTime : timeline.duration - b.vTime;

    const pauseMs = b.pause ?? 0;
    const mediaSpanMs = Math.max(0, totalSpanMs - pauseMs);

    const pauseFrom = b.vTime + mediaSpanMs;
    const pauseTo = pauseFrom + pauseMs;

    if (pauseMs > 0 && vTime >= pauseFrom && vTime < pauseTo) return 'pause';
    return 'media';
  }, [snapshot.state.vTime, timeline, selectedIndex]);

  /**
   * Render:
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
