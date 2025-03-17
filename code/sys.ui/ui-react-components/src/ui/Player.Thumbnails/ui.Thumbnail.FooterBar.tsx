import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx } from './common.ts';
import { Timestamp } from './u.ts';

export type FooterBarProps = {
  timestamp: t.StringTimestamp;
  timestamps?: t.VideoTimestamps;
  isCurrent?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = FooterBarProps;

/**
 * Component.
 */
export const FooterBar: React.FC<P> = (props) => {
  const { isCurrent, timestamp, timestamps } = props;
  const time = wrangle.time(timestamp);

  /**
   * Render.
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      borderTop: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      fontSize: 12,
      PaddingY: 1,
      display: 'grid',
      placeItems: 'center',
      backgroundColor: isCurrent ? DEFAULTS.BLUE : undefined,
      color: isCurrent ? Color.WHITE : undefined,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{time}</div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  time(ts: t.StringTimestamp) {
    ts = Timestamp.toString(ts);
    return ts.slice(0, ts.indexOf('.'));
  },
} as const;
