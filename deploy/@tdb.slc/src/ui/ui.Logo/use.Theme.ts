import { useEffect, useState } from 'react';
import { type t, Theme } from './common.ts';

/**
 * Handle updating the canvas theme.
 */
export function useTheme(svg: t.SvgInstance<HTMLDivElement>, theme?: t.CommonTheme) {
  const [, setRender] = useState(0);

  useEffect(() => {
    const color = Theme.color(theme);

    /**
     * TODO 🐷 NB: theme colors not updating on SVG (Bug 🐛).
     */
    const setColor = (color: string, elements: t.SvgElement[]) => {
      elements.forEach((el) => {
        el.fill(color);
      });
    };
    setColor(color, svg.queryAll('path'));
  }, [svg.draw, theme]);
}
