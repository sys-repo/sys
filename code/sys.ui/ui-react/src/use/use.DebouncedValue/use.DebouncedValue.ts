import { useEffect, useRef, useState } from 'react';
import type { t } from '../common.ts';

/**
 * Delays a value update until it stays stable for the given time-window.
 *
 * @param value  The incoming (rapidly changing) value.
 * @param ms     How long (in ms) the value must stay unchanged before publishing.
 */
export const useDebouncedValue: t.UseDebouncedValue = (value, ms = 120) => {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const delay = Math.max(0, ms ?? 0);

    if (timer.current) clearTimeout(timer.current);
    timer.current = globalThis.setTimeout(() => setDebounced(value), delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = undefined;
    };
  }, [value, ms]);

  return debounced;
};
