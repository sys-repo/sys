import React from 'react';
import { useTimestamps } from '../use.Timestamps.ts';
import { type t, Cropmarks, css, Player, Sheet } from './common.ts';

export type PullDownProps = t.VideoContentProps;

/**
 * Component:
 */
export const Pulldown: React.FC<PullDownProps> = (props) => {
  const { state, content } = props;
  const { showElapsed = true } = content;

  const breakpoint = state.breakpoint;
  const media = content.media;
  const player = media?.video;
  const timestamp = useTimestamps(player, media?.timestamps);

  /**
   * Render:
   */
  const gutter = breakpoint.name === 'Desktop' ? 40 : 10;
  const edgeTrack = `minmax(${gutter}px, 1fr)`;
  const centerTrack = `minmax(0px, 960px)`;
  const edge: t.SheetMarginInput = [edgeTrack, centerTrack, edgeTrack];

  const styles = {
    base: css({ position: 'relative', marginBottom: 218 }),
    body: css({ Absolute: 0, display: 'grid' }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <Cropmarks
        size={{ mode: 'fill', x: true, y: true, margin: [30, 30, 30, 30] }}
        borderOpacity={0.06}
      >
        {timestamp.pulldown}
      </Cropmarks>
    </div>
  );

  return (
    <Sheet
      {...props}
      style={styles.base}
      theme={props.theme}
      edgeMargin={edge}
      orientation={'Top:Down'}
    >
      {elBody}
      <Player.Timestamp.Elapsed.View
        player={player}
        show={showElapsed}
        abs={[null, 15, 10, null]}
      />
    </Sheet>
  );
};
