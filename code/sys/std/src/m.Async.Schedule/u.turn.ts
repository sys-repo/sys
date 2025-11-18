import { type t } from './common.ts';
import { makeScheduleFn } from './u.scheduleFunction.ts';

const macro = makeScheduleFn('macro');
const micro = makeScheduleFn('micro');

export async function tick() {
  await macro();
  await micro();
}

export const waitFor: t.SchedulerLib['waitFor'] = async (pred, timeout = 1500) => {
  const deadline = Date.now() + timeout;
  await tick(); // initial settle
  while (Date.now() < deadline) {
    if (pred()) return;
    await tick();
  }
  throw new Error(`waitFor: timeout - ${timeout}ms`);
};
