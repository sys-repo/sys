import React from 'react';
import { type t, Color, css, Svg } from './common.ts';
import { useMouse } from './use.Mouse.tsx';
import { useTheme } from './use.Theme.ts';

export type SvgImageProps = {
  selected?: t.CanvasPanel;
  over?: t.CanvasPanel;
  bgBlur?: number;

  theme?: t.CommonTheme;
  style?: t.CssInput;

  onPanelEvent?: t.LogoCanvasPanelHandler;
  onReady?: () => void;
};

/**
 * Component.
 *
 */
export const SvgImage: React.FC<SvgImageProps> = (props) => {
  const { bgBlur = 20, over, selected, onPanelEvent } = props;
  const theme = Color.theme(props.theme);

  /**
   * Source design, search Figma: "canvas.mini"
   */
  const svg = Svg.useSvg<HTMLDivElement>(() => import('./canvas.mini.svg'), [354, 184]);

  useTheme(svg, theme.name);
  useMouse(svg, { theme: theme.name, over, selected, onPanelEvent });

  /**
   * Effect: ready.
   */
  React.useEffect(() => {
    if (svg.ready) props.onReady?.();
  }, [svg.ready]);

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      cursor: 'default',
      color: theme.fg,
      backdropFilter: `blur(${bgBlur}px)`,
      lineHeight: 0, // NB: ensure no "baseline" gap below the <svg>.
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div ref={svg.ref} />
    </div>
  );
};
