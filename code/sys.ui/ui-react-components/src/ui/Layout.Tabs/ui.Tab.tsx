import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './common.ts';

export type TabProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Tab: React.FC<TabProps> = (props) => {
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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 Tab`}</div>
    </div>
  );
};
