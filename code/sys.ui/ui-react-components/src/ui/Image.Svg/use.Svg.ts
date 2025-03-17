import { useEffect, useRef } from 'react';
import { type t, SVG, SvgElement } from './common.ts';

/**
 * Hook: SVG image import/renderer.
 */
export function useSvg<T extends HTMLElement>(
  dataUri: string,
  viewboxWidth: number,
  viewboxHeight: number,
  init?: t.UseSvgInit,
): t.SvgInstance<T> {
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

    // NB: Set the viewBox to ensure proper scaling of the inner content.
    //     These values will be the "viewBox" attribute on the <svg> root tag of the [.svg] file.
    const viewBox = `0 0 ${viewboxWidth} ${viewboxHeight}`;
    draw.attr({ viewBox });

    // Decode the data URL (the part after the comma is the encoded SVG markup)
    // and inject the SVG markup into the svg.js canvas.
    const svgMarkup = decodeURIComponent(dataUri.split(',')[1]);
    draw.svg(svgMarkup);

    // Initialize.
    drawRef.current = draw;
    init?.(api);

    // Finish up.
    return () => {
      draw.clear();
      draw.remove();
    };
  }, [dataUri]);

  /**
   * API
   */
  const api: t.SvgInstance<T> = {
    ref,
    get draw() {
      return draw;
    },
    query(selector) {
      if (!ref.current) return undefined;
      const el = ref.current.querySelector(selector);
      return el ? SVG(el) : undefined;
    },
    queryAll(selector) {
      if (!ref.current) return [];
      const matches = ref.current.querySelectorAll(selector);
      return Array.from(matches).map((el) => SVG(el));
    },
  };
  return api;
}
