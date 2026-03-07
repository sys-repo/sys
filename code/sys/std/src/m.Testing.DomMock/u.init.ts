import { type t, Schedule } from './common.ts';
import { polyfill, unpolyfill } from './u.polyfill.ts';

export const init: t.DomMockLib['init'] = (args) => {
  const before = async () => {
    polyfill();
    await drain();
  };

  const after = async () => {
    await terminalDrain();
    unpolyfill();
    await terminalDrain();
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
 * Single macrotask drain.
 *
 * Used for lightweight boundaries (per-test).
 */
const drain = () => Schedule.macro();

/**
 * Terminal async drain.
 *
 * Used only at suite teardown (afterAll) to guarantee:
 * - no pending microtasks
 * - no pending macrotasks
 * - no raf-scheduled followups
 *
 * This does NOT mask real leaks (intervals, long timers still fail),
 * but eliminates scheduler/HappyDOM tail noise.
 */
async function terminalDrain() {
  // Microtasks
  await Schedule.micro();

  // Macrotasks
  await Schedule.macro();

  // Frame callbacks (may schedule timers)
  await Schedule.raf();

  // Final macrotask to catch raf fallout
  await Schedule.macro();
}
