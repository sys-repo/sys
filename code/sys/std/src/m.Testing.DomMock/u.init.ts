import { type t, Schedule } from './common.ts';
import { polyfill, unpolyfill } from './u.polyfill.ts';

export const init: t.DomMockLib['init'] = (args) => {
  const before = async () => {
    polyfill();
    await drain();
  };

  const after = async () => {
    await drain();
    unpolyfill();
    await drain();
  };

  if (args.beforeEach) {
    args.beforeEach(before);
    args.afterEach(after);
    return;
  }

  args.beforeAll(before);
  args.afterAll(after);
};

/**
 * Drain one macrotask tick to flush queued timers/immediates.
 *
 * Used to enforce a clean async boundary around DomMock setup/teardown:
 *
 * - after polyfill:    ensures setup-started timers complete before tests run
 * - before unpolyfill: ensures queued timers complete while the DOM is still present
 * - after unpolyfill:  allows trailing HappyDOM/React scheduler timers to settle
 *
 * Intentionally one macro hop (not micro) to catch scheduler/HappyDOM timers
 * without masking real leaks (intervals, long timers still fail).
 */
const drain = () => Schedule.macro();
