import React from 'react';
import {
  type t,
  AppSignals,
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

export type BodyProps = t.ContentTimestampProps;

export const Body: React.FC<BodyProps> = (props) => {
  const { content, index, state, timestamp } = props;
  const player = AppSignals.Player.find(state, content, index);

  const currentTime = player?.props.currentTime;

  Signal.useRedrawEffect(() => {
    player?.props.currentTime.value;
  });

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', display: 'grid', placeItems: 'center' }),
    body: css({ display: 'grid', placeItems: 'center', rowGap: '40px' }),
    logo: css({ width: 130, MarginX: 40 }),
    canvas: css({ MarginX: 40 }),

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
        <div>{'Overview: Body'}</div>
      </div>
    </div>
  );
};
