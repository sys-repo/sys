import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, Rx, Signal } from './common.ts';
import { toEdgeOffset } from './u.ts';

type P = t.KeyValueItemProps;

/**
 * Component:
 */
export const Hr: React.FC<P> = (props) => {
  const { debug = false, item } = props;
  if (item.kind !== 'hr') return null;

  // item.
  const x = toEdgeOffset(item.x);
  const y = toEdgeOffset(item.y ?? 5);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      Padding: [y[0], x[1], y[1], x[0]],
      display: 'grid',
    }),
    line: css({
      backgroundColor: theme.fg,
      height: item.thickness ?? 1,
      opacity: item.opacity ?? 0.2,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.line.class} />
    </div>
  );
};
