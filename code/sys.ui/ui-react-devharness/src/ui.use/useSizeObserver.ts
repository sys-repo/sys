import { useEffect, useState } from 'react';

type E = HTMLElement;

/**
 * Monitor size of an HTML/DOM element.
 *
 * Ref:
 *    Standards API
 *    https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 *
 */
export function useSizeObserver<T extends E = HTMLDivElement>(refs: React.RefObject<T>[]) {
  const ready = refs.every((ref) => typeof ref.current === 'object');
  const [count, setCount] = useState(0);

  /**
   * Lifecycle
   */
  useEffect(() => {
    let observer: ResizeObserver;

    // NB: ensure safe when run in CI on server.
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver((_entries) => setCount((prev: number) => prev + 1));
      const elements = refs.map((ref) => ref.current!).filter(Boolean);
      elements.forEach((el) => observer.observe(el));
    }

    /**
     * Dispose
     */
    return () => observer?.disconnect();
  }, [ready, refs.length > 0]);

  /**
   * API
   */
  return { ready, refs, count };
}
