import React from 'react';

import { useTimeline } from '../use.Timeline.ts';
import { type t, Playback } from './common.ts';
import { Layout } from './ui.Layout.tsx';

export const Harness: React.FC<t.MediaTimelineHarnessProps> = (props) => {
  const { debug = false, bundle, docid, video } = props;
  const hasBundle = !!bundle;

  /**
   * Timeline data (pure).
   */
  const { timeline } = useTimeline(bundle?.spec);

  /**
   * Playback runtime (imperative edge).
   */
  const runtime = React.useMemo<t.PlaybackRuntime>(() => {
    if (!video) return Playback.runtime.noop();
    return Playback.runtime.fromVideoSignals(video);
  }, [video]);


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
      layout={props.layout}
      theme={props.theme}
      style={props.style}
      selectedIndex={selectedIndex}
      onSelectIndex={(e) => controller.seekToBeat(e.index)}
    />
  );
};
