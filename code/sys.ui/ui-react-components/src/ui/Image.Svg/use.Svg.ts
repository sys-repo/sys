import { useEffect, useRef } from 'react';
import { type t, SVG, SvgElement } from './common.ts';

/**
 * Hook: SVG image import/renderer.
 */
export const useSvg: t.UseSvg = <T extends HTMLElement>(
  base64Import: string,
  init?: t.UseSvgInit,
) => {
  const ref = useRef<T>(null);
  const drawRef = useRef<SvgElement>();
  const draw = drawRef.current;

  /**
   * Load the SVG data and inject into DOM.
   */
  useEffect(() => {
    if (!ref.current) return;

    // Create an SVG canvas inside the container element.
    const draw: SvgElement = SVG().addTo(ref.current);
    draw.attr({ viewBox: '0 0 1059 1059' }); // NB: Set the viewBox to ensure proper scaling of the inner content.

    // Decode the data URL (the part after the comma is the encoded SVG markup)
    // and inject the SVG markup into the svg.js canvas.
    const svgMarkup = decodeURIComponent(base64Import.split(',')[1]);
    draw.svg(svgMarkup);

    // Delegate to callback initializer.
    init?.(draw);

    // Finish up.
    drawRef.current = draw;
    return () => {
      draw.clear();
      draw.remove();
    };
  }, [base64Import]);

  /**
   * API
   */
  const api: t.UseSvgInstance<T> = { ref, draw };
  return api;
};
