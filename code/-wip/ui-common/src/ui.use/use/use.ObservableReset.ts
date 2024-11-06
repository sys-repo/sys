import { useEffect, useState } from 'react';
import { rx, type t } from '../common.ts';

/**
 * Increments a reset counter via signals from an observable.
 */
export function useObservableReset(
  reset$?: t.Observable<any>,
  options: { debounce?: t.Msecs } = {},
) {
  const { debounce = 10 } = options;
  const [count, setCount] = useState(0);
  const inc = () => setCount((n: number) => n + 1);

  useEffect(() => {
    const { dispose$, dispose } = rx.disposable();
    const $ = reset$?.pipe(rx.takeUntil(dispose$), rx.debounceTime(debounce));
    $?.subscribe(inc);
    return dispose;
  }, [!!reset$, debounce]);

  /**
   * API
   */
  return {
    count,
    inc,
  } as const;
}
