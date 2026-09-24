import type { t } from '../common.ts';
import { Duration } from '../m.Duration/mod.ts';

/**
 * Measure elapsed wall-clock time; system clock changes affect the result.
 */
export function timer(start?: Date, options: { round?: number } = {}) {
  let startedAt = new Date(start ?? Date.now());
  const api: t.Time.Timer = {
    get startedAt() {
      return new Date(startedAt);
    },
    reset() {
      startedAt = new Date(Date.now());
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
