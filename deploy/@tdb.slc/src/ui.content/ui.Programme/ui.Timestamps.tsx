import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, useTimestamps } from './common.ts';

export type TimestampsProps = {
  timestamps?: t.ContentTimestamps;
  player?: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Timestamps: React.FC<TimestampsProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      padding: 30,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 Timestamps`}</div>
    </div>
  );
};
