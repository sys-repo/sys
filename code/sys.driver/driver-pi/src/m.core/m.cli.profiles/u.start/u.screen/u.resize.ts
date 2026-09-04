import type { Cli, t } from '../common.ts';

import { createOwnedError } from '../u.error.ts';
import { snapshotResizeAfter } from './u.input.ts';

/** Observe terminal resize events and return their cleanup function. */
export function observeResizeWith(
  createEvents: typeof Cli.Screen.events,
  handler: (size: unknown) => void,
): () => void {
  let events: ReturnType<typeof createEvents> | undefined;
  try {
    events = createEvents();
    const subscription = events.resize$.subscribe((event: t.Cli.Screen.SizeChanged) => {
      handler(snapshotResizeAfter(event));
    });
    let subscribed = true;
    let active = true;
    return () => {
      const failures: unknown[] = [];
      if (subscribed) {
        try {
          subscription.unsubscribe();
          subscribed = false;
        } catch (cause) {
          failures.push(cause);
        }
      }
      if (active) {
        try {
          events!.dispose();
          active = false;
        } catch (cause) {
          failures.push(cause);
        }
      }
      throwCleanupFailures(failures);
    };
  } catch {
    try {
      events?.dispose();
    } catch {
      // The caller receives a bounded acquisition failure.
    }
    throw createOwnedError('start:gui screen resize acquisition failed.');
  }
}

export function throwCleanupFailures(failures: readonly unknown[]): void {
  if (failures.length > 0) throw createOwnedError('start:gui screen cleanup failed.');
}
