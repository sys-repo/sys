import React from 'react';
import { ElapsedTime, usePulldown, useTimestamps } from '../ui/mod.ts';
import { type t, css, Player, Sheet, Time } from './common.ts';

export type OverviewProps = t.VideoContentProps;

/**
 * Component:
 */
export const Overview: React.FC<OverviewProps> = (props) => {
  const { state, content } = props;
  const { showElapsed = true } = content;

  const player = content.media?.video;
  const timestamp = useTimestamps(props, player);
  usePulldown(props, timestamp);

  /**
   * Effect: Play on load.
   */
  React.useEffect(() => {
    if (content.playOnLoad) player?.play();
  }, [player]);

  /**
   * Render:
   */
  const edge: t.SheetMarginInput = state.breakpoint.name === 'Desktop' ? ['1fr', 390, '1fr'] : 10;
  const styles = {
    base: css({ marginTop: 44 }),
    body: css({ position: 'relative', display: 'grid', gridTemplateRows: '1fr auto' }),
    content: css({ display: 'grid' }),
    player: css({ marginBottom: -1 }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <div className={styles.content.class}>{timestamp.column}</div>
      <Player.Video.View
        signals={player}
        style={styles.player}
        onEnded={() => Time.delay(1_000, () => state.stack.clear(1))} // NB: add time buffer before hiding.
      />
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
      <ElapsedTime player={player} abs={true} show={showElapsed} />
    </Sheet>
  );
};
