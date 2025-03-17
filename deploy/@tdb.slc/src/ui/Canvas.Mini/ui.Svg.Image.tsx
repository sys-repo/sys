import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, Svg } from './common.ts';

import Image from '../../public/canvas/canvas.mini.svg';

export type SvgImageProps = {
  width?: number;
  selected?: t.CanvasPanel;
  over?: t.CanvasPanel;
  bgBlur?: number;

  theme?: t.CommonTheme;
  style?: t.CssInput;

};

/**
 * Component.
 */
export const SvgImage: React.FC<SvgImageProps> = (props) => {
  const { width = DEFAULTS.width } = props;

  const svg = Svg.useSvg<HTMLDivElement>(Image, 354, 184, (draw) => draw.width(width));
  const draw = svg.draw;

  useEffect(() => {
    draw?.width(width);
  }, [svg.draw, width]);

  /**
   * Render.
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div ref={svg.ref} />
    </div>
  );
};
