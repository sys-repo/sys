import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './common.ts';
import { Grid } from './ui.Grid.tsx';

/**
 * Component:
 */
export const Browser: React.FC<t.DistBrowserProps> = (props) => {
  const { debug = false, dist } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    header: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.header.class}>{`Header`}</div>
      <Grid theme={theme.name} dist={dist} debug={debug} />
    </div>
  );
};
