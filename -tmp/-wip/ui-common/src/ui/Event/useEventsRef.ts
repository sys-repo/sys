import { useEffect, useRef } from 'react';
import type { t } from '../common.ts';

/**
 * Lifecycle manager for managing an [Events] API within a react component
 * disposing of the [Events] object when the component unmounts.
 */
export function useEventsRef<E extends t.Disposable>(factory: () => E) {
  const eventsRef = useRef<E>(factory());

  useEffect(() => {
    const events = eventsRef.current;
    return () => events?.dispose?.();
  }, []);

  return eventsRef.current;
}
