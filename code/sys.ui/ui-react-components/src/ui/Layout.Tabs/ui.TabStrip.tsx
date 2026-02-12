import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './common.ts';
import { Tab } from './ui.Tab.tsx';

export type TabStripProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const TabStrip: React.FC<TabStripProps> = (props) => {
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
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 TabStrip`}</div>
    </div>
  );
};
