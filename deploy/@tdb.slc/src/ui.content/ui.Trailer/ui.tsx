import React from 'react';
import { type t, css, Player, Sheet, Time, useTimestamps, useVideoPlayer } from './common.ts';

export type TrailerProps = t.VideoContentProps;

/**
 * Component:
 */
export const Trailer: React.FC<TrailerProps> = (props) => {
  const { state, content } = props;
  const { media, showElapsed = true } = content;

  const player = useVideoPlayer(media, content.playOnLoad);
  const timestamp = useTimestamps(player, media?.timestamps);

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

  return (
    <Sheet
      {...props}
      theme={props.theme}
      style={styles.base}
      edgeMargin={edge}
      orientation={'Bottom:Up'}
    >
      <div className={styles.body.class}>
        <div className={styles.content.class}>{timestamp.column}</div>
        <Player.Video.View
          signals={player}
          style={styles.player}
          onEnded={() => Time.delay(1_000, () => state.stack.clear(1))} // NB: add time buffer before hiding.
        />
      </div>
      <Player.Timestamp.Elapsed.View player={player} abs={true} show={showElapsed} />
    </Sheet>
  );
};
