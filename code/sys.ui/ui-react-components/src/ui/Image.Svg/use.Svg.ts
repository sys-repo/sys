import { useEffect, useRef, useState } from 'react';
import { type t, SVG, SvgElement } from './common.ts';
import { rx } from '../common.ts';

/**
 * Hook: SVG image import/renderer.
 */
export function useSvg<T extends HTMLElement>(
  svgImport: string | (() => t.SvgImportPromise),
  viewboxWidth: number,
  viewboxHeight: number,
  init?: t.UseSvgInit<T>,
): t.SvgInstance<T> {
  type R = t.SvgInstance<T>;

  const ref = useRef<T>(null);
  const drawRef = useRef<SvgElement>();
  const draw = drawRef.current;

  const [ready, setReady] = useState(false);
  const [importString, setImportString] = useState('');

  /**
   * Methods.
   */
  const query: R['query'] = (selector) => {
    if (!ref.current) return undefined;
    const el = ref.current.querySelector(selector);
    return el ? SVG(el) : undefined;
  };

  const queryAll: R['queryAll'] = (selector) => {
    if (!ref.current) return [];
    const matches = ref.current.querySelectorAll(selector);
    return Array.from(matches).map((el) => SVG(el));
  };

  /**
   * Effect: load/import SVG data.
   */
  useEffect(() => {
    const life = rx.lifecycle();
    if (typeof svgImport === 'string') setImportString(svgImport);
    if (typeof svgImport === 'function') svgImport().then((m) => setImportString(m.default));
    return life.dispose;
  }, [svgImport]);

  /**
   * Effect: Load the SVG data and inject into DOM.
   */
  useEffect(() => {
    if (!ref.current) return;
    if (!importString) return;

    // Create an SVG canvas inside the container element.
    const draw: SvgElement = SVG().addTo(ref.current);

    // NB: Set the viewBox to ensure proper scaling of the inner content.
    //     These values will be the "viewBox" attribute on the <svg> root tag of the [.svg] file.
    const viewBox = `0 0 ${viewboxWidth} ${viewboxHeight}`;
    draw.attr({ viewBox });

    console.log('importString', importString);
    const dataUri = importString;

    // Decode the data URL (the part after the comma is the encoded SVG markup)
    // and inject the SVG markup into the svg.js canvas.
    const svgMarkup = decodeURIComponent(dataUri.split(',')[1]);
    draw.svg(svgMarkup);

    // Initialize.
    drawRef.current = draw;
    init?.({ draw, query, queryAll });
    setReady(true);

    // Finish up.
    return () => {
      draw.clear();
      draw.remove();
    };
  }, [importString]);

  /**
   * API
   */
  const api: R = { ready, ref, draw, query, queryAll };
  return api;
}
