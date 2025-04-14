import React from 'react';
import { type t, css, Svg, DEFAULTS } from './common.ts';
import { useTheme, setColors } from './use.Theme.ts';

const Images = {
  slc: { import: () => import('./images/logo.slc.svg'), size: [112, 81] },
  cc: { import: () => import('./images/logo.cc.svg'), size: [345, 84] },
};

export const LogoWordmark: React.FC<t.LogoWordmarkProps> = (props) => {
  const { theme } = props;
  const kind = props.logo ?? DEFAULTS.logo;

  /**
   * Source design, search Figma: "logo.slc"
   */
  const src = wrangle.svg(kind);
  const svg = Svg.useSvg<HTMLDivElement>(src.import, src.size);
  useTheme(svg, theme);

  /**
   * Keep SVG colors in sync with the current props.
   */
  React.useEffect(() => setColors(svg, theme), [kind, svg, theme]);

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

/**
 * Helpers
 */
const wrangle = {
  svg(kind: 'SLC' | 'CC') {
    if (kind === 'SLC') return Images.slc;
    if (kind === 'CC') return Images.cc;
    throw new Error(`Not supported: "${kind}"`);
  },
} as const;
