import { Path } from './common.ts';

/**
 * Tiny promise semaphore for concurrency control.
 */
export function semaphore(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  const runNext = () => {
    active -= 1;
    const fn = queue.shift();
    if (fn) fn();
  };

  return <T>(fn: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const run = async () => {
        active++;
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
}

/**
 * Very small filename sanitizer used when the URL is invalid.
 * Produces a relative POSIX filename with hostile chars tamed.
 */
export function sanitizeForFilename(input: string): string {
  const s = Path.relativePosix(input);
  return (
    s
      .replace(/[:?#&%*"<>\|]+/g, '_') // ← tame illegal/shell-hostile chars.
      .replace(/\/+/g, '_') //            ← collapse any slashes (keep it a single file).
      .slice(0, 180) || 'invalid'
  );
}
