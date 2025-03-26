import { type Ref, type MutableRefObject, useCallback, useEffect, useState } from 'react';
import type { t } from '../common.ts';

export const useSizeObserver: t.UseSizeObserverHook = <T extends HTMLElement>(
  externalRef?: Ref<T>,
) => {
  const [element, setElement] = useState<T>();
  const [size, setSize] = useState<DOMRectReadOnly>();

  /**
   * Wrangle ref (internally created, or externally passed).
   */
  const callbackRef = useCallback(
    (element: T | null) => {
      setElement(element === null ? undefined : element);
      if (externalRef) {
        if (typeof externalRef === 'function') {
          externalRef(element);
        } else {
          (externalRef as MutableRefObject<T | null>).current = element;
        }
      }
    },
    [externalRef],
  );

  /**
   * Effect: monitor the DOM element.
   */
  useEffect(() => {
    if (!element || typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === element) setSize(entry.contentRect);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  /**
   * API:
   */
  const api: t.UseSizeObserver<T> = {
    ref: callbackRef,
    size,
  };
  return api;
};
