import { useCallback, useEffect, useState } from 'react';
import type { t } from './common.ts';

/**
 * Hook Factory: monitor size changes to a DOM element using [ResizeObserver].
 */
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
    if (rect) onChange?.({ rect, toObject });
  }, [rect]);

  /**
   * API
   */
  const toObject = () => wrangle.asObject(rect);
  return {
    ref,
    get ready() {
      return rect !== undefined;
    },
    get width() {
      return rect?.width;
    },
    get height() {
      return rect?.height;
    },
    rect,
    toObject,
  };
};

/**
 * Helpers
 */
const wrangle = {
  asObject(rect?: DOMRect): t.DomRect {
    if (!rect) return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
    const { x, y, width, height, top, right, bottom, left } = rect;
    return { x, y, width, height, top, right, bottom, left };
  },
} as const;
