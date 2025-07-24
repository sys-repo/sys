import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, DEFAULTS, rx } from './common.ts';

type P = t.SampleProps;

/**
 * Component:
 */
export const EditorsColumn: React.FC<P> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 EditorsColumn`}</div>
    </div>
  );
};
