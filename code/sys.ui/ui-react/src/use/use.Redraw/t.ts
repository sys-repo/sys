import type { t } from '../common.ts';

/**
 * Hook: useRedraw
 *
 * Subscribes to an optional Rx observable and returns a stable
 * callback that triggers a coalesced React redraw.
 *
 * - If `$` is provided, emits automatically invoke the redraw.
 * - If omitted, the returned function can be called manually.
 *
 * Example:
 * ```ts
 * const redraw = useRedraw(events$);
 * // or manual trigger:
 * const redraw = useRedraw();
 * redraw();
 * ```
 */
export type UseRedraw = ($?: t.Observable<any>) => () => void;
