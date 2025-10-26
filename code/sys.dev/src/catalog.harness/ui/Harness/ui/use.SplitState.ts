import React from 'react';
import { type t, Rx } from '../common.ts';

const PERSIST_DEBOUNCE: t.Msecs = 300;
const DEFAULT_RATIO: t.Percent = 0.3; // used when ratio is undefined

/**
 * Split-pane state (scalar-backed) with array facade for SplitPane.
 */
export function useSplitState(state_?: unknown) {
  const state = state_ as t.HarnessStateRef | undefined;

  /**
   * Local state: scalar "left" ratio in [0..1].
   */
  const ratioRef$ = React.useRef<t.Subject<t.Percent | undefined>>(Rx.subject());
  const [ratio, setRatio] = React.useState<t.Percent | undefined>(state?.current.split);

  // Track latest ratio for safe flush on unmount.
  const latestRatioRef = React.useRef<typeof ratio>(ratio);
  React.useEffect(() => void (latestRatioRef.current = ratio), [ratio]);

  /**
   * Stream changes from local state.
   */
  React.useEffect(() => ratioRef$.current.next(ratio), [ratio]);

  /**
   * Persist after the user pauses; flush on unmount/blur.
   */
  React.useEffect(() => {
    if (!state) return;
    const { dispose, signal, dispose$ } = Rx.abortable();

    const safeUpdate = (current?: t.Percent) => {
      state.change((d) => {
        if (current == null) delete d.split;
        else d.split = current;
      });
    };

    const flush = () => safeUpdate(latestRatioRef.current);

    ratioRef$.current
      .pipe(
        Rx.takeUntil(dispose$),
        Rx.debounceTime(PERSIST_DEBOUNCE),
        Rx.distinctWhile((p, n) => p === n),
      )
      .subscribe(safeUpdate);

    if (typeof window !== 'undefined') {
      window.addEventListener('blur', flush, { signal });
    }

    return () => {
      dispose();
      flush();
    };
  }, [state?.instance, state?.change]);

  /**
   * Facade for the new SplitPane API (array-based).
   */
  const ratios: t.Percent[] = React.useMemo(() => {
    const left = ratio ?? DEFAULT_RATIO;
    const right = 1 - left;
    return [left, right];
  }, [ratio]);

  const setRatios = React.useCallback(
    (next: t.Percent[] | ((prev: t.Percent[]) => t.Percent[])) => {
      const prev = ratios;
      const arr = typeof next === 'function' ? next(prev) : next;
      const left = Array.isArray(arr) && typeof arr[0] === 'number' ? arr[0] : prev[0];
      setRatio(left);
    },
    [ratios],
  );

  /**
   * API
   */
  return {
    // scalar (backing store)
    ratio,
    setRatio,

    // array facade (for <SplitPane value/onChange>)
    ratios,
    setRatios,
  } as const;
}
