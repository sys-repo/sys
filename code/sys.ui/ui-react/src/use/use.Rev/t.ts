/**
 * Type definitions for the {@link useRev} hook.
 *
 * A revision-based redraw primitive for React components.
 * - Calling the returned function triggers a coalesced state update.
 * - Intended for use with `useRev` (see `useRev.ts`).
 *
 * Example:
 * ```ts
 * const [rev, bump] = useRev('raf');
 * useEffect(bump, [someSignal]);
 * ```
 */
export type UseRev = () => () => void;
