import React from 'react';
import type { HarnessProps } from './t.ts';

import { type t, PlaybackDriver } from './common.ts';
import { Layout } from './ui.Layout.tsx';
import { useOrchestrator } from './use.Orchestrator.ts';

type OrchestratedProps = HarnessProps & {
  timeline: ReturnType<typeof PlaybackDriver.usePlaybackTimeline>;
  experience: NonNullable<ReturnType<typeof PlaybackDriver.usePlaybackTimeline>['experience']>;
};

/**
 * Mounts the driver/orchestrator hooks after inputs are ready.
 */
export const Orchestrated: React.FC<OrchestratedProps> = (props) => {
  const { debug = false, bundle, docid, decks, timeline, experience } = props;
  const orchestrator = useOrchestrator({
    bundle,
    decks,
    docid,
    timeline: experience,
    startBeat: 0,
  });

  /**
   * Refs:
   */
  const onReadyRef = React.useRef<HarnessProps['onReady']>(undefined);
  const lastReadyRef = React.useRef<t.StringId>(undefined);

  /**
   * Effect: fire `onReady` only when the controller instance changes.
   */
  React.useEffect(() => void (onReadyRef.current = props.onReady), [props.onReady]);
  React.useEffect(() => {
    const onReady = onReadyRef.current;
    if (!onReady) return;

    const controller = orchestrator.controller;
    const instance = controller.id?.instance;
    if (instance && lastReadyRef.current === instance) return;

    lastReadyRef.current = instance;
    onReady({ controller });
  }, [orchestrator.controller]);

  const activePhase = React.useMemo((): 'media' | 'pause' | null => {
    if (!timeline.playback || !orchestrator.snapshot) return null;
    if (orchestrator.selected?.index == null) return null;

    const vTime = orchestrator.snapshot.state.vTime;
    if (vTime == null) return null;

    const b = timeline.playback.beats[orchestrator.selected?.index];
    if (!b) return null;

    const next = timeline.playback.beats[orchestrator.selected?.index + 1];
    const totalSpanMs = next ? next.vTime - b.vTime : timeline.playback.virtualDuration - b.vTime;

    const pauseMs = b.pause ?? 0;
    const mediaSpanMs = Math.max(0, totalSpanMs - pauseMs);

    const pauseFrom = b.vTime + mediaSpanMs;
    const pauseTo = pauseFrom + pauseMs;

    if (pauseMs > 0 && vTime >= pauseFrom && vTime < pauseTo) return 'pause';
    return 'media';
  }, [orchestrator.snapshot?.state.vTime, timeline.playback, orchestrator.selected?.index]);

  return (
    <Layout
      hasBundle={!!bundle}
      debug={debug}
      docid={docid}
      decks={decks}
      bundle={bundle}
      layout={props.layout}
      theme={props.theme}
      style={props.style}
      selected={orchestrator.selected}
      activePhase={activePhase}
      onSelectIndex={(e) => orchestrator.controller.seekToBeat(e.index)}
    />
  );
};
