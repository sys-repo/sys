import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, DEFAULTS, rx } from './common.ts';

/**
 * Component:
 */
export const SampleReact: React.FC<t.SampleReactProps> = (props) => {
  const { debug = false, factory, plan } = props;


  if (!factory || !plan) return null;

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
