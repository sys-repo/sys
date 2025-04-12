import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Component:
 */
export function PreloadPortal({ children }: { children: React.ReactNode }) {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.width = '0';
    el.style.height = '0';
    el.style.overflow = 'hidden';
    el.style.opacity = '0';
    divRef.current = el;
    document.body.appendChild(el);

    // Clean up after one animation frame (long enough to trigger lazy imports)
    requestAnimationFrame(() => {
      if (divRef.current) {
        document.body.removeChild(divRef.current);
        divRef.current = null;
      }
    });

    return () => {
      if (divRef.current) {
        document.body.removeChild(divRef.current);
        divRef.current = null;
      }
    };
  }, []);

  return divRef.current ? createPortal(children, divRef.current) : null;
}
