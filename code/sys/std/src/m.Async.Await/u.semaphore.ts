import { type t } from './common.ts';

/**
 * Tiny promise semaphore for concurrency control.
 */
export const semaphore: t.AwaitLib['semaphore'] = (max: number) => {
  if (!Number.isFinite(max) || max < 1) {
    throw new RangeError(`semaphore: "max" must be a finite number >= 1 (got ${max})`);
  }
  max = Math.floor(max);

  let active = 0;
  const queue: Array<() => void> = [];

  const runNext = () => {
    active -= 1;
    const fn = queue.shift();
    if (fn) fn();
  };

  return <T>(fn: () => Promise<T>) => {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        active += 1;
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          runNext();
        }
      };
      active < max ? run() : queue.push(run);
    });
  };
};
