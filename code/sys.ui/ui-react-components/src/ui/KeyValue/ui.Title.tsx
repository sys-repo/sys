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

  const title = wrangle.parts(item);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const spacing = toSpacing(item.x, item.y ?? 1);
  const styles = {
    base: css({
      Margin: spacing.edges,
      color: theme.fg,
      fontFamily: 'sans-serif',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
    label: css({
      fontWeight: 700,
      letterSpacing: 0.2,
      opacity: 0.9,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{title[0]}</div>
      <div />
      <div className={styles.label.class}>{title[1]}</div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  parts(item: t.KeyValueTitle) {
    const v = item.v;
    return Array.isArray(v) ? [v[0], v[1]] : [v, undefined];
  },
} as const;
