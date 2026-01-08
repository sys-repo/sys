import React from 'react';
import type { HarnessProps } from './t.ts';

import { type t, PlaybackDriver } from './common.ts';
import { Layout } from './ui.Layout.tsx';
import { useOrchestrator } from './use.Orchestrator.ts';

type OrchestratedProps = HarnessProps & {
  timeline: ReturnType<typeof PlaybackDriver.usePlaybackTimeline>;
  experience: NonNullable<ReturnType<typeof PlaybackDriver.usePlaybackTimeline>['experience']>;
};
type ReadyRef = {
  controller?: t.TimecodePlaybackDriver.TimelineController;
  onReady?: HarnessProps['onReady'];
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

  // Fire `onReady` when controller instance or callback changes.
  const lastReadyRef = React.useRef<ReadyRef | undefined>(undefined);
  React.useEffect(() => {
    const onReady = props.onReady;
    if (!onReady) return;

    const curr = orchestrator.controller;
    const last = lastReadyRef.current;

    if (last?.controller === curr && last?.onReady === onReady) return;

    lastReadyRef.current = { controller: curr, onReady };
    onReady({ controller: curr });
  }, [props.onReady, orchestrator.controller]);

  const beat =
    orchestrator.selectedIndex != null ? experience.beats[orchestrator.selectedIndex] : undefined;

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

  return (
    <Layout
      hasBundle={!!bundle}
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
