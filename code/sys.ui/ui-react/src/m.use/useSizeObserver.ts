import { useCallback, useEffect, useState } from 'react';
import type { t } from '../common.ts';

export const useSizeObserver: t.UseSizeObserver = <T extends HTMLElement>(
  onChange?: t.SizeObserverChangeHandler,
) => {
  const ref = useCallback((el: T | null) => setElement(el), []);

  const [element, setElement] = useState<T | null>(null);
  const [rect, setRect] = useState<DOMRectReadOnly | undefined>();

  /**
   * Effect: monitor DOM element size.
   */
  useEffect(() => {
    if (!element) return;
    if (typeof ResizeObserver !== 'function') return;

    const observer = new ResizeObserver((entries) => {
      entries
        .filter((entry) => entry.target === element)
        .forEach((entry) => setRect(entry.contentRect));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  /**
   * Effect: alert listeners on change.
   */
  useEffect(() => {
    if (rect) onChange?.({ rect });
  }, [rect]);

  /**
   * API
   */
  return { ref, rect };
};
