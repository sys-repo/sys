import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './common.ts';

export type MediaTimelineGridProps = {
  debug?: boolean;
  bundle?: t.SpecTimelineBundle;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const TimelineGrid: React.FC<MediaTimelineGridProps> = (props) => {
  const { debug = false, bundle } = props;

  if (!bundle) return null;

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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 TimelineGrid`}</div>
    </div>
  );
};
