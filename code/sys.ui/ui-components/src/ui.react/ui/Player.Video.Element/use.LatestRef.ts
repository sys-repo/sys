import { useEffect, useRef } from 'react';

/**
 * Keep a mutable ref in sync with the latest value.
 *
 * Useful for reading the most recent callback or prop from effects
 * without re-subscribing or re-running those effects when the value
 * identity changes.
 *
 * - Does not trigger re-renders
 * - Safe for event handlers and async effects
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => void (ref.current = value), [value]);
  return ref;
}
