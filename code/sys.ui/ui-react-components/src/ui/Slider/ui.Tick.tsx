import React from 'react';
import { Color, css, type t } from './common.ts';

export type TickProps = {
  tick: t.SliderTick;
  style?: t.CssValue;
};

export const Tick: React.FC<TickProps> = (props) => {
  const { tick } = props;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      Absolute: [0, -5, 0, -5],
      display: 'grid',
      justifyContent: 'center',
    }),
    inner: css({
      backgroundColor: Color.DARK,
      opacity: 0.15,
      width: 1,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} title={tick.label}>
      <div {...styles.inner} />
    </div>
  );
};
