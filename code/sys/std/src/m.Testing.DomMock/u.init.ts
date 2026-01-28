import { type t, Schedule } from './common.ts';
import { polyfill, unpolyfill } from './u.polyfill.ts';

import { afterEach, beforeEach } from '../m.Testing/m.Bdd.ts';

export const init: t.DomMockLib['init'] = (before, after) => {
  // before(async () => {
  //   polyfill();
  //   await drain();
  // });

  beforeEach(async () => {
    polyfill();
    await drain();
  });

  // TEMP 🐷
  // beforeEach(async () => await drain());
  // afterEach(async () => await drain());

  afterEach(async () => {
    await drain();
    unpolyfill();
  });

  // after(async () => {
  //   await drain();
  //   unpolyfill();
  // });
};

/**
 * Drain one macrotask tick to flush queued timers/immediates.
 *
 * Used to enforce a clean async boundary around DomMock setup/teardown:
 *
 * - after polyfill:    ensures setup-started timers complete before tests run
 * - before unpolyfill: ensures queued timers complete while the DOM is still present
 *
 * Intentionally one macro hop (not micro) to catch scheduler/HappyDOM timers
 * without masking real leaks (intervals, long timers still fail).
 */
const drain = () => Schedule.macro();
