import { useEffect, useRef, useState } from 'react';
import { type t, rx, SVG, SvgElement } from './common.ts';

/**
 * Hook: SVG image import/renderer.
 */
export function useSvg<T extends HTMLElement>(
  svgImport: string | (() => t.SvgImportPromise),
  viewboxWidth: number,
  viewboxHeight: number,
  init?: t.UseSvgInit<T> | number,
): t.SvgInstance<T> {
  type R = t.SvgInstance<T>;

  const ref = useRef<T>(null);
  const drawRef = useRef<SvgElement>();
  const draw = drawRef.current;

  const [ready, setReady] = useState(false);
  const [importString, setImportString] = useState('');
  const [svgMarkup, setSvgMarkup] = useState('');

  /**
   * Methods:
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
   * Effect: import SVG data.
   */
  useEffect(() => {
    const life = rx.lifecycle();
    if (typeof svgImport === 'string') setImportString(svgImport);
    if (typeof svgImport === 'function') svgImport().then((m) => setImportString(m.default));
    return life.dispose;
  }, [svgImport]);

  /**
   * Effect: load/parse the import string into <SVG> markup.
   */
  useEffect(() => {
    if (!importString) return;

    // Load from embedded data-uri:
    if (importString.startsWith('data:image/')) {
      const svg = decodeURIComponent(importString.split(',')[1]);
      setSvgMarkup(svg);
      return;
    }

    // Fetch SVG data from server:
    const life = rx.lifecycle();
    fetch(importString).then(async (res) => {
      if (life.disposed) return;
      setSvgMarkup(res.ok ? await res.text() : '');
    });
    return life.dispose;
  }, [importString]);

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
    draw.svg(svgMarkup);

    // Initialize.
    drawRef.current = draw;
    if (typeof init === 'function') init({ draw, query, queryAll });
    if (typeof init === 'number') draw.width(init);

    // Finish up.
    setReady(true);
    return () => {
      draw.clear();
      draw.remove();
    };
  }, [svgMarkup]);

  /**
   * API:
   */
  const api: R = { ready, ref, draw, query, queryAll };
  return api;
}
