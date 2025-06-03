import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { MuteButton, PlayButton } from './ui.Buttons.tsx';
import { Mask } from './ui.Mask.tsx';
import { SeekSlider } from './ui.SeekSlider.tsx';

export const PlayerControls: React.FC<t.PlayerControlsProps> = (props) => {
  const {
    debug = false,
    playing = D.playing,
    muted = D.muted,
    currentTime = 0,
    duration = 0,
  } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, padding: 10 }),
    mask: css({ Absolute: [null, 0, 0, 0], zIndex: 0 }),
    body: css({
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: `auto 1fr auto`,
      columnGap: 10,
      zIndex: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Mask style={styles.mask} opacity={props.maskOpacity} height={props.maskHeight} />
      <div className={styles.body.class}>
        <PlayButton playing={playing} onClick={() => props.onClick?.({ control: 'Play' })} />
        <SeekSlider currentTime={currentTime} duration={duration} onSeek={props.onSeek} />
        <MuteButton muted={muted} onClick={() => props.onClick?.({ control: 'Mute' })} />
      </div>
    </div>
  );
};
