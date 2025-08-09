import React from 'react';
import {
  type t,
  css,
  Player,
  Sheet,
  Time,
  usePulldown,
  useTimestamps,
  useVideoPlayer,
} from './common.ts';

export type OverviewProps = t.VideoContentProps;

/**
 * Component:
 */
export const Overview: React.FC<OverviewProps> = (props) => {
  const { state, content } = props;
  const { media, showElapsed = true } = content;

  const player = useVideoPlayer(media, content.playOnLoad, props.muted);
  const video = player.signals;
  const timestamp = useTimestamps(video, media?.timestamps);
  usePulldown(props, video, timestamp);

  /**
   * Render:
   */
  const edge: t.SheetMarginInput = state.breakpoint.name === 'Desktop' ? ['1fr', 390, '1fr'] : 10;
  const styles = {
    base: css({ marginTop: 44 }),
    body: css({ position: 'relative', display: 'grid', gridTemplateRows: '1fr auto' }),
    content: css({ display: 'grid' }),
  };

  const elPlayer = player.render({
    style: { marginBottom: -1 },
    onEnded: (e) => Time.delay(1_000, () => state.stack.clear(1)), // NB: add time buffer before hiding.
  });

  const elBody = (
    <div className={styles.body.class}>
      <div className={styles.content.class}>{timestamp.column}</div>
      {elPlayer}
    </div>
  );

  return (
    <Sheet
      {...props}
      style={styles.base}
      theme={props.theme}
      edgeMargin={edge}
      orientation={'Bottom:Up'}
    >
      {elBody}
      <Player.Timestamp.Elapsed.View video={player.signals} abs={true} show={showElapsed} />
    </Sheet>
  );
};
