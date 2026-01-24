import { type t, Schedule } from '../common.ts';

import { FakeTime } from '@std/testing/time';

/**
 * Execute a test body within a FakeTime sandbox.
 *
 * Ensures all timers and microtasks are scoped to the test and
 * automatically cleaned up on exit (even on failure).
 *
 * NOTE: Inline for now. Promote to @sys/testing once stabilized.
 */
export async function withFakeTime(fn: () => Promise<void> | void): Promise<void> {
  using _time = new FakeTime();
  await fn();
}
