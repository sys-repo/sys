import React from 'react';
import { Color, css, type t } from './common.ts';

export type TickProps = {
  tick: t.SliderTick;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Tick: React.FC<TickProps> = (props) => {
  const { tick } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Absolute: [0, -5, 0, -5],
      display: 'grid',
      justifyContent: 'center',
    }),
    inner: css({
      backgroundColor: theme.bg,
      opacity: 0.15,
      width: 1,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} title={tick.label}>
      <div className={styles.inner.class} />
    </div>
  );
};
