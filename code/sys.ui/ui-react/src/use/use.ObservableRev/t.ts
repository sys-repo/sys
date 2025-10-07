import type { t } from '../common.ts';

/**
 * Hook: useObservableRev
 *
 * Subscribes to an optional Rx observable and returns a stable
 * callback that triggers a coalesced React revision update.
 *
 * - If an observable is provided, each emission automatically bumps the rev.
 * - If omitted, the returned function can be invoked manually.
 *
 * Example:
 * ```ts
 * const bump = useObservableRev(events$);
 * // or manual trigger:
 * const bump = useObservableRev();
 * bump();
 * ```
 */
export type UseObservableRev = (source$?: t.Observable<unknown>) => () => void;
