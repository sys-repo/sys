import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { PlayButton, MuteButton } from './ui.Buttons.tsx';

export const PlayerControls: React.FC<t.PlayerControlsProps> = (props) => {
  const { debug = false, playing = D.playing, muted = D.muted } = props;

  console.log('playing', playing);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
    body: css({
      display: 'grid',
      gridTemplateColumns: `auto 1fr auto`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <PlayButton playing={playing} onClick={() => props.onClick?.({ control: 'Play' })} />
        <div></div>
        <MuteButton muted={muted} onClick={() => props.onClick?.({ control: 'Mute' })} />
      </div>
    </div>
  );
};
