import React, { useState } from 'react';
import { type t, css, DEFAULTS, Svg } from './common.ts';

export const Logo: React.FC<t.LogoProps> = (props) => {
  const { width = DEFAULTS.width } = props;

  const svg = Svg.useSvg<HTMLDivElement>(
    () => import('../../../images/logo.slc.svg'),
    72,
    56,
    width,
  );
  // useTheme(svg, props.theme);

  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

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
    <div ref={svg.ref} className={css(styles.base, props.style).class}>
      <div ref={svg.ref} />
    </div>
  );
};
