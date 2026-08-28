import type { t } from '../common.ts';
import { Duration } from '../m.Duration/mod.ts';

/**
 * Starts a timer.
 */
export function timer(start?: Date, options: { round?: number } = {}) {
  let startedAt = start || new Date();
  const api: t.Time.Timer = {
    startedAt,
    reset() {
      startedAt = new Date();
      return api;
    },
    get elapsed() {
      const start = startedAt.getTime();
      const end = Date.now();
      return Duration.elapsed(start, end, options);
    },
  };
  return api;
}
