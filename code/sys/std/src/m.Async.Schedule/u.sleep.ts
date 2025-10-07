import { type t } from './common.ts';
import { Schedule } from './m.Schedule.ts';

/**
 * Sleep for N milliseconds (timer-backed).
 *
 * Semantics:
 * - Resolves after at least `ms` have elapsed.
 * - If `andThen` is provided, performs a hop on that scheduler queue after the timer.
 * - If `andThen` is omitted/undefined (or explicitly false/null), no extra hop is performed.
 */
export const sleep: t.SchedulerLib['sleep'] = async (
  ms: t.Msecs,
  andThen?: t.AsyncSchedule | null | false,
) => {
  await new Promise<void>((resolve) => {
    Schedule.queue(() => resolve(), { queue: { ms } });
  });

  if (andThen) {
    if (andThen === 'micro') {
      await Schedule.micro();
    } else if (andThen === 'macro') {
      await Schedule.macro();
    } else if (andThen === 'raf') {
      await Schedule.raf();
    }
  }
};
