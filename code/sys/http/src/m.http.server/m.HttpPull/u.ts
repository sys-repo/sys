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

/**
 * Tiny async queue for events.
 * Workers call `push`, the consumer `for await ... of` drains them.
 */
export function makeEventQueue<T>() {
  const buffer: T[] = [];
  const waiters: Array<(v: IteratorResult<T>) => void> = [];
  let closed = false;

  const push = (value: T) => {
    if (closed) return;
    const waiter = waiters.shift();
    if (waiter) waiter({ value, done: false });
    else buffer.push(value);
  };

  const close = () => {
    if (closed) return;
    closed = true;
    while (waiters.length) {
      const w = waiters.shift()!;
      w({ value: undefined as any, done: true });
    }
  };

  const iterator: AsyncIterator<T> = {
    next: () =>
      new Promise<IteratorResult<T>>((resolve) => {
        if (buffer.length) {
          const value = buffer.shift()!;
          resolve({ value, done: false });
        } else if (closed) {
          resolve({ value: undefined as any, done: true });
        } else {
          waiters.push(resolve);
        }
      }),
  };

  return {
    push,
    close,
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return iterator;
    },
  };
}
