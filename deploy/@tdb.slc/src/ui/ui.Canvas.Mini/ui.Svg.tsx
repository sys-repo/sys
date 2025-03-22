import React from 'react';
import { type t, Color, css, DEFAULTS, Svg } from './common.ts';
import { useMouse } from './use.Mouse.tsx';
import { useTheme } from './use.Theme.ts';

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

  const svg = Svg.useSvg<HTMLDivElement>(
    () => import('../../../images/canvas.mini.svg'),
    [354, 184],
    (e) => e.draw.width(width),
  );

  useTheme(svg, theme.name);
  useMouse(svg, { theme: theme.name, over, selected, onPanelEvent });

  /**
   * Effect: keep SVG dimentions in sync.
   */
  React.useEffect(() => {
    svg.draw?.width(width);
  }, [svg.draw, width]);

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      cursor: 'default',
      color: theme.fg,
      backdropFilter: `blur(${bgBlur}px)`,
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
