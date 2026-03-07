import React from 'react';
import { type t, Color, css, PlaybackDriver } from './common.ts';

export type TimelineInfoProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  playback?: t.SpecTimelineManifest;
  assets?: readonly t.SpecTimelineAsset[];
  snapshot?: t.TimecodeState.Playback.Snapshot;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const TimelineInfo: React.FC<TimelineInfoProps> = (props) => {
  const { debug = false } = props;
  const timeline = PlaybackDriver.Util.usePlaybackTimeline({
    spec: props.playback
      ? { composition: props.playback.composition, beats: props.playback.beats }
      : undefined,
  });

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gap: 8,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <PlaybackDriver.Dev.InfoPanel.UI
        theme={theme.name}
        experience={timeline.experience}
        bundle={toBundle(props.playback, props.assets)}
        snapshot={props.snapshot}
        resolved={timeline.resolved}
      />
    </div>
  );
};

function toBundle(
  playback?: t.SpecTimelineManifest,
  assets?: readonly t.SpecTimelineAsset[],
): t.SpecTimelineBundle | undefined {
  if (!playback) return undefined;
  const table = new Map<string, t.SpecTimelineAsset>();
  for (const item of assets ?? []) {
    table.set(`${item.kind}:${item.logicalPath}`, item);
  }
  return {
    docid: playback.docid,
    spec: {
      composition: playback.composition,
      beats: playback.beats,
    },
    resolveAsset(args) {
      return table.get(`${args.kind}:${args.logicalPath}`);
    },
  };
}
