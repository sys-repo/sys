import { useState, useEffect } from 'react';
import { type t, Theme } from './common.ts';

/**
 * Handle updating the canvas theme.
 */
export function useTheme(svg: t.SvgInstance<HTMLDivElement>, theme?: t.CommonTheme) {
  useEffect(() => setColors(svg, theme), [svg.draw, theme]);
}

export function setColors(svg: t.SvgInstance<HTMLDivElement>, theme?: t.CommonTheme) {
  const setColor = (color: string, selector: string) => {
    svg.queryAll(selector).forEach((el) => el.fill(color));
  };
  const color = Theme.color(theme);
  setColor(color, 'path');
  setColor(color, 'ellipse');
}
