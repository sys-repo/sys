import { useEffect } from 'react';

/**
 * Turns on or off the "rubberband" effect when a page is scrolled
 * past the top or bottom.
 */
export function useRubberband(allow: boolean) {
  useEffect(() => {
    document.body.style.overflow = allow ? 'auto' : 'hidden';
  }, [allow]);
}
