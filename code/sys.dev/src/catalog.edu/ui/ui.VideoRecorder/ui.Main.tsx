import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, Cropmarks, css, D, Rx, Signal } from './common.ts';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
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
    }),
    body: css({
      padding: 15,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name}>
      </Cropmarks>
    </div>
  );
};
