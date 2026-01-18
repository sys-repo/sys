import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './common.ts';

/**
 * Minimal stack manager - pure data structure only
 */
export const SlugSheetStack: React.FC<t.SlugSheetStackProps> = (props) => {
  const { debug = false, items } = props;

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
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <div>{`🐷 SlugSheetStack`}</div>
    </div>
  );
};
