import React from 'react';
import { type t, Color, css } from './common.ts';

type P = t.KeyValueItemProps;

/**
 * Component:
 */
export const Title: React.FC<P> = (props) => {
  const { debug = false, item } = props;
  if (item.kind !== 'title') return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    label: css({
      fontWeight: 700,
      letterSpacing: 0.2,
      opacity: 0.9,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{item.v}</div>
    </div>
  );
};
