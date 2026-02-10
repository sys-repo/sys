import React from 'react';
import { type t, Color, css } from './common.ts';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Aux: React.FC<P> = (props) => {
  const { debug = false, slots = {} } = props;
  if (!slots.aux) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    content: css({
      Absolute: 0,
      display: 'grid',
    }),
  };

  return <div className={css(styles.base, props.style).class}>{slots.aux}</div>;
};
