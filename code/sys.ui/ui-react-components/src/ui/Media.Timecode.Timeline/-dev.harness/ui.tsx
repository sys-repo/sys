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

  const beat = selectedIndex != null && timeline ? timeline.beats[selectedIndex] : undefined;

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
      onSelectIndex={(e) => controller.seekToBeat(e.index)}
    />
  );
};
