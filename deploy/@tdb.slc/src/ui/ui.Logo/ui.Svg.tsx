import React from 'react';
import { type t, css, DEFAULTS, Svg } from './common.ts';
import { useTheme } from './use.Theme.ts';

export const Logo: React.FC<t.LogoProps> = (props) => {
  const { width = DEFAULTS.width } = props;

  /**
   * Source design, search Figma: "logo.slc"
   */
  const svg = Svg.useSvg<HTMLDivElement>(() => import('./logo.slc.svg'), [112, 81], width);
  useTheme(svg, props.theme);

  /**
   * Effect: keep SVG dimentions in sync.
   */
  React.useEffect(() => {
    svg.draw?.width(width);
  }, [svg.draw, width]);

  /**
   * Render:
   */
  const styles = { base: css({}) };
  return (
    <div className={css(styles.base, props.style).class}>
      <div ref={svg.ref} />
    </div>
  );
};
