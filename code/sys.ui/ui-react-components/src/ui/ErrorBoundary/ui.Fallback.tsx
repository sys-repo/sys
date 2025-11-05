import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, Is, Obj, Rx, Signal, Str } from './common.ts';

export type ErrorBoundaryFallbackProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = (props) => {
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
    </div>
  );
};
