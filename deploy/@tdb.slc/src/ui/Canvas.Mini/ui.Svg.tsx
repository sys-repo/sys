import React, { useEffect } from 'react';
import { type t, Color, css, DEFAULTS, Svg } from './common.ts';
import { useMouse } from './use.Mouse.tsx';
import { useTheme } from './use.Theme.ts';

import Image from '../../../images/canvas/canvas.mini.svg';

export type SvgImageProps = {
  width?: number;
  selected?: t.CanvasPanel;
  over?: t.CanvasPanel;
  bgBlur?: number;

  theme?: t.CommonTheme;
  style?: t.CssInput;

  onPanelEvent?: t.CanvasPanelEventHandler;
};

/**
 * Component.
 */
export const SvgImage: React.FC<SvgImageProps> = (props) => {
  const { width = DEFAULTS.width, bgBlur = 20, over, selected, onPanelEvent } = props;
  const theme = Color.theme(props.theme);

  const svg = Svg.useSvg<HTMLDivElement>(Image, 354, 184, (e) => e.draw.width(width));
  const draw = svg.draw;

  useTheme(svg, theme.name);
  useMouse(svg, {
    theme: theme.name,
    over,
    selected,
    onPanelEvent,
  });

  useEffect(() => {
    draw?.width(width);
  }, [draw, width]);

  /**
   * Render.
   */
  const styles = {
    base: css({
      position: 'relative',
      cursor: 'default',
      color: theme.fg,
      backdropFilter: `blur(${bgBlur})px)`,
      borderRadius: width * 0.08,
      width,
      lineHeight: 0, // NB: ensure no "baseline" gap below the <svg>.
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div ref={svg.ref} />
    </div>
  );
};
