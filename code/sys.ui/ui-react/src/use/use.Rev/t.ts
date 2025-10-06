import type { t } from '../common.ts';

/**
 * Type definitions for the {@link useRev} hook.
 *
 * A revision-based redraw primitive for React components.
 *
 * - `rev` is a monotonic counter that increments when `bump()` is called.
 * - `bump()` schedules a coalesced state update using the specified scheduler mode.
 * - Intended for coalescing high-frequency updates (micro, macro, or raf).
 *
 * Example:
 * ```ts
 * const [rev, bump] = useRev('raf');
 * useEffect(bump, [someSignal]);
 * ```
 */
export type UseRev = (mode?: t.AsyncSchedule) => readonly [number, () => void];
