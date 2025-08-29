import React from 'react';
import { type t, rx } from '../common.ts';

const PERSIST_DEBOUNCE: t.Msecs = 300;

/**
 * Handles split-pane state.
 */
export function useSplitState(state_?: unknown) {
  const state = state_ as t.HarnessStateRef | undefined;

  /**
   * Hooks:
   */
  const ratioRef$ = React.useRef<t.Subject<t.Percent | undefined>>(rx.subject());
  const [ratio, setRatio] = React.useState<t.Percent | undefined>(state?.current.split);

  // Track latest ratio for safe flush:
  const latestRatioRef = React.useRef<typeof ratio>(ratio);
  React.useEffect(() => void (latestRatioRef.current = ratio), [ratio]);

  /**
   * Effect:
   * - Push local changes into the stream.
   */
  React.useEffect(() => ratioRef$.current.next(ratio), [ratio]);

  /**
   * Effect:
   * - Persist after the user pauses.
   * - Flush on unmount/blur to avoid losing the last change.
   */
  React.useEffect(() => {
    if (!state) return;
    const { dispose, signal, dispose$ } = rx.abortable();

    ratioRef$.current
      .pipe(
        rx.takeUntil(dispose$),
        rx.debounceTime(PERSIST_DEBOUNCE), // ← wait for user to pause; coalesce rapid updates.
        rx.distinctWhile((p, n) => p === n),
      )
      .subscribe((ratio) => {
        state?.change((d) => (d.split = ratio));
      });

    // Flush helper.
    const flush = () => state.change((d) => (d.split = latestRatioRef.current));

    // Flush on unmount and when tab loses focus.
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', flush, { signal });
    }

    return () => {
      dispose();
      flush();
    };
  }, [state?.instance, state?.change]);

  /**
   * API:
   */
  return { ratio, setRatio } as const;
}
