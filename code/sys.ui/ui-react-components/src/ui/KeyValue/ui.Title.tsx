import React from 'react';
import { type t, Color, css } from './common.ts';
import { toSpacing } from './u.ts';

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
  const spacing = toSpacing(item.x, item.y ?? 1);
  const styles = {
    base: css({
      Margin: spacing.edges,
      color: theme.fg,
      display: 'grid',
      fontFamily: 'sans-serif',
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
