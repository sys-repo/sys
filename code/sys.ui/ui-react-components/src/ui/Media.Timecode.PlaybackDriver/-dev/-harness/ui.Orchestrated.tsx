import React from 'react';
import type { HarnessProps } from './t.ts';

import { type t, PlaybackDriver } from './common.ts';
import { Layout } from './ui.Layout.tsx';
import { useActivePhase } from './use.ActivePhase.ts';
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

  /**
   * Refs:
   */
  const onReadyRef = React.useRef<HarnessProps['onReady']>(undefined);
  const lastReadyRef = React.useRef<t.StringId>(undefined);

  /**
   * Glue driver state + controller into a UI‑ready bundle.
   */
  const orchestrator = useOrchestrator({
    bundle,
    decks,
    docid,
    experience,
    startBeat: 0,
  });

  const { controller, selected, snapshot } = orchestrator;
  const activePhase = useActivePhase({
    playback: timeline.playback,
    selectedIndex: selected?.index,
    vTime: snapshot?.state.vTime,
  });

  /**
   * Fire `onReady` only when the controller instance changes.
   */
  React.useEffect(() => void (onReadyRef.current = props.onReady), [props.onReady]);
  React.useEffect(() => {
    const onReady = onReadyRef.current;
    if (!onReady) return;

    const instance = controller.id?.instance;
    if (instance && lastReadyRef.current === instance) return;

    lastReadyRef.current = instance;
    onReady({ controller });
  }, [controller]);

  return (
    <Layout
      hasBundle={!!bundle}
      debug={debug}
      docid={docid}
      decks={decks}
      bundle={bundle}
      snapshot={snapshot}
      layout={props.layout}
      theme={props.theme}
      style={props.style}
      selected={orchestrator.selected}
      activePhase={activePhase}
      onSelectIndex={(e) => orchestrator.controller.seekToBeat(e.index)}
    />
  );
};
