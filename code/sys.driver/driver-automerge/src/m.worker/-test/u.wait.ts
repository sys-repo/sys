import { Schedule } from '../common.ts';

/**
 * Wait helpers:
 */
export const Wait = {
  /** Flush a single MessagePort delivery cycle (macro) then microtasks. */
  async tick() {
    await Schedule.macro(); // MessageChannel deliveries land on the task (macro) queue
    await Schedule.micro(); // drain follow-on microtasks scheduled by handlers
  },

  /** Flush N cycles. */
  async flush(rounds = 2) {
    for (let i = 0; i < rounds; i++) await Wait.tick();
  },

  async waitFor(pred: () => boolean, timeoutMs = 1500) {
    const deadline = Date.now() + timeoutMs;
    await Wait.tick(); // initial settle
    while (Date.now() < deadline) {
      if (pred()) return;
      await Wait.tick();
    }
    throw new Error('waitFor: timeout');
  },
};
