import React from 'react';
import {
  type t,
  App,
  LogoCanvas,
  Color,
  css,
  DEFAULTS,
  LogoWordmark,
  Player,
  Sheet,
  Signal,
  VIDEO,
} from '../ui.ts';

export type BodyProps = t.ContentTimestampProps & { selected?: t.CanvasPanel };

export const Body: React.FC<BodyProps> = (props) => {
  const { content, index, state, timestamp, selected = 'purpose' } = props;

  const player = App.Signals.Player.find(state, content, index);
  const currentTime = player?.props.currentTime;

  console.log('timestamp', timestamp);

  /**
   * Effect: redraw on signal change.
   */
  Signal.useRedrawEffect(() => {
    // player?.props.currentTime.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid', placeItems: 'center' }),
    body: css({ display: 'grid', placeItems: 'center', rowGap: '40px' }),
    canvas: css({ MarginX: 60 }),
    logo: css({ width: 130, MarginX: 40 }),

    tmp: css({
      Absolute: [6, 6, null, null],
      fontSize: 12,
      opacity: 0.4,
      pointerEvents: 'none',
    }),
  };

  const elTmp = (
    <div className={styles.tmp.class}>
      {props.timestamp} | {currentTime?.value.toFixed(2)}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elTmp}
      <div className={styles.body.class}>
        <LogoCanvas theme={theme.name} style={styles.canvas} selected={selected} />
        <LogoWordmark theme={theme.name} style={styles.logo} />
      </div>
    </div>
  );
};
