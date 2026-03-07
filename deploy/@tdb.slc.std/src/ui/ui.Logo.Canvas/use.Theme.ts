import { useEffect } from 'react';
import { type t } from './common.ts';
import { Theme } from './u.ts';

/**
 * Handle updating the canvas theme.
 */
export function useTheme(svg: t.SvgInstance<HTMLDivElement>, theme?: t.CommonTheme) {
  useEffect(() => {
    const color = Theme.color(theme);
    const setColor = (color: string, elements: t.SvgElement[]) => {
      elements.forEach((el) => {
        el?.fill(color);
        el?.stroke(color);
      });
    };
    setColor(color, svg.queryAll('#border'));
    setColor(color, svg.queryAll('#outline'));
    setColor(color, svg.queryAll('#grid-lines line'));
  }, [svg.draw, theme]);
}
