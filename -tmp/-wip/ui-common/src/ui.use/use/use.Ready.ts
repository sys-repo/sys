import { useEffect, useRef, useState } from 'react';
import { rx, type t } from '../common.ts';

/**
 * Hook that returns a stable, singular, debounced ready flag.
 */
export function useReady(debounce: t.Msecs, deps: React.DependencyList) {
  const ref$ = useRef(rx.subject());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    const $ = ref$.current.pipe(rx.takeUntil(dispose$), rx.debounceTime(debounce));
    $.subscribe(() => setReady(true));
    return dispose;
  }, []);

  useEffect(() => {
    if (!ready) ref$.current.next();
  }, deps);

  return ready;
}
