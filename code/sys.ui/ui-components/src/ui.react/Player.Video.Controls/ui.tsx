import React from 'react';
import { type t, Color, css, D, Style } from './common.ts';
import { Background } from './ui.Background.tsx';
import { MuteButton, PlayButton } from './ui.Buttons.tsx';
import { Mask } from './ui.Mask.tsx';
import { SeekSlider } from './ui.SeekSlider.tsx';
import { Timestamp } from './ui.Timestamp.tsx';

export const PlayerControls: React.FC<t.PlayerControlsProps> = (props) => {
  const {
    debug = false,
    enabled = D.enabled,
    playing = D.playing,
    muted = D.muted,
    padding = D.padding,
    margin = D.margin,
    background,
    currentTime = 0,
    duration = 0,
  } = props;
  const hasBackground = (background?.opacity ?? 0) > 0;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: Color.WHITE,
      ...Style.toPadding(padding),
      ...Style.toMargins(margin),
    }),
    mask: css({ Absolute: [null, 0, 0, 0], zIndex: 0 }),
    body: css({
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: `auto 1fr auto auto`,
      columnGap: 10,
      zIndex: 10,
    }),
    background: css({ Absolute: 0 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Mask style={styles.mask} opacity={props.maskOpacity} height={props.maskHeight} />
      {hasBackground && <Background {...props} style={styles.background} />}
      <div className={styles.body.class}>
        <PlayButton
          enabled={enabled}
          playing={playing}
          onClick={() => props.onClick?.({ button: 'Play' })}
        />
        <SeekSlider
          style={{ top: 1, position: 'relative' }}
          enabled={enabled}
          duration={duration}
          currentTime={currentTime}
          buffering={props.buffering}
          buffered={props.buffered}
          onSeeking={props.onSeeking}
        />
        <Timestamp enabled={enabled} currentTime={currentTime} duration={duration} />
        <MuteButton
          style={{ top: -1, position: 'relative' }}
          enabled={enabled}
          muted={muted}
          onClick={() => props.onClick?.({ button: 'Mute' })}
        />
      </div>
    </div>
  );
};
