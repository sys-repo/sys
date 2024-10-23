import { useEffect, useRef } from 'react';
import type { t } from './common.ts';

type T = Map<number, t.ModuleListItemVisibility>;
type Percent = number; // 0..1
type LiMap = Map<number, HTMLLIElement>;

/**
 * Keep track of the visibility of visible list-items as they scroll.
 */
export function useScrollObserver(
  baseRef: React.RefObject<HTMLDivElement>,
  itemRefs: LiMap,
  callback: t.ModuleListItemVisibilityHandler | undefined,
  options: { threshold?: Percent | [Percent, Percent, Percent, Percent] } = {},
) {
  const mapRef = useRef<T>(new Map<number, t.ModuleListItemVisibility>());

  useEffect(() => {
    let observer: IntersectionObserver;
    const root = baseRef.current;
    const rootMargin = '0px';
    const threshold = options.threshold ?? 0.75;

    const map = mapRef.current;
    map.clear();

    if (root) {
      const options = { root, rootMargin, threshold };

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLLIElement;
          const index = Array.from(itemRefs.values()).findIndex((item) => item === el);
          const isVisible = entry.isIntersecting;
          map.set(index, { index, isVisible, threshold });
        });

        callback?.({ children: toArray(mapRef) });
      }, options);

      // Start observing the elements.
      Array.from(itemRefs.values()).forEach((el) => observer.observe(el));
    }

    return () => {
      map.clear();
      observer?.disconnect();
    };
  }, [itemRefs.size]);

  /**
   * API
   */
  return {
    length: itemRefs.size,
    get items() {
      return toArray(mapRef);
    },
  };
}

/**
 * [Helpers]
 */

function toArray(mapRef: React.MutableRefObject<T>) {
  return Array.from(mapRef.current.values());
}
