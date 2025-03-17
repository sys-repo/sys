import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, Svg } from './common.ts';
import { SvgImage } from './ui.Svg.Image.tsx';

type P = t.CanvasMiniProps;

/**
 * Component.
 */
export const CanvasMini: React.FC<P> = (props) => {
  const { width = DEFAULTS.width } = props;

  /**
   * Render.
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      cursor: 'default',
      position: 'relative',
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <SvgImage theme={props.theme} width={props.width} />
    </div>
  );
};
