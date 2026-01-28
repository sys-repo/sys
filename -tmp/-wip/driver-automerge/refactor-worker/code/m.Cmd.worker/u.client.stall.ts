import { type t, Rx } from './common.ts';

export type StallDetector = {
  /** Mark that we've seen recent activity from the worker. */
  touch(): void;
};

export type StallDetectorOptions = {
  /** How long (msecs) of silence before we flip stalled → true. */
  stallAfter: t.Msecs;
  /**
   * Callback invoked when stalled flag changes.
   * Caller is responsible for emitting any repo events.
   */
  onStalledChange(next: boolean): void;
  until: t.UntilInput;
};

/**
 * Polling-based stall detector.
 * - Caller calls `touch()` whenever we see *any* evidence the worker is alive
 *   (repo event, RPC result, etc).
 * - If there is no touch() for `stallAfter` msecs, we flip `stalled` to true.
 */
export function createStallDetector(options: StallDetectorOptions): StallDetector {
  const { stallAfter, onStalledChange } = options;
  const life = Rx.lifecycle(options.until);
  const state = { stalled: false, lastSeen: Date.now() };

  const setStalled = (next: boolean) => {
    if (next === state.stalled) return;
    state.stalled = next;
    onStalledChange(next);
  };

  const tick = () => {
    const elapsed = Date.now() - state.lastSeen;
    setStalled(elapsed >= stallAfter);
  };

  // Poll at a modest cadence; we don't need high-frequency checks.
  const interval = setInterval(tick, stallAfter / 2);
  life.dispose$.subscribe(() => clearInterval(interval));

  const touch = () => {
    state.lastSeen = Date.now();
    // Any activity is proof of life → clear stalled if it was set.
    if (state.stalled) setStalled(false);
  };

  return { touch } as const;
}
