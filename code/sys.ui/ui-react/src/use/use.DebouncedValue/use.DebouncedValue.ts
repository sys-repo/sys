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
  const timer = useRef<number>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(value), ms);

    /** Cleanup: cancel on unmount or value-change. */
    return () => clearTimeout(timer.current);
  }, [value, ms]);

  return debounced;
};
