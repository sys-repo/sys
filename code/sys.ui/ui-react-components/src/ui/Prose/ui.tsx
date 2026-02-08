import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './common.ts';

type P = t.Prose.ManuscriptProps;

/**
 * Component:
 */
export const Manuscript: React.FC<P> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
    </div>
  );
};
