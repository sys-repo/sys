import { useEffect, useRef, useState } from 'react';

/**
 * Delays a value update until it stays stable for the given time-window.
 *
 * @param value  The incoming (rapidly changing) value.
 * @param ms     How long (in ms) the value must stay unchanged before publishing.
 */
export function useDebouncedValue<T>(value: T, ms = 120): T {
  const [debounced, setDebounced] = useState<T>(value);
  const timer = useRef<number>();

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(value), ms);

    /** Cleanup: cancel on unmount or value-change. */
    return () => clearTimeout(timer.current);
  }, [value, ms]);

  return debounced;
}
