// m.Time.frame.ts

import type { t } from '../common.ts';

/**
 * Yield to the next animation frame.
 * - SSR/Node fallback: schedules a 0 ms macrotask.
 * - If `signal` aborts before the frame, the promise rejects with `AbortError`.
 */
export function nextFrame(opts?: t.TimeFrameOptions): Promise<void> {
  const { signal } = opts ?? {};
  if (signal?.aborted) return Promise.reject(abortError());

  return new Promise<void>((resolve, reject) => {
    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (rafId != null && typeof (globalThis as any).cancelAnimationFrame === 'function') {
        (globalThis as any).cancelAnimationFrame(rafId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };

    const onAbort = () => {
      cleanup();
      reject(abortError());
    };

    if (signal) signal.addEventListener('abort', onAbort, { once: true });

    const raf =
      typeof (globalThis as any).requestAnimationFrame === 'function'
        ? ((globalThis as any).requestAnimationFrame as (cb: FrameRequestCallback) => number)
        : undefined;

    if (raf) {
      rafId = raf(() => {
        cleanup();
        resolve();
      });
    } else {
      timeoutId = setTimeout(() => {
        cleanup();
        resolve();
      }, 0);
    }
  });
}

/**
 * Yield to two animation frames (paint, then settle).
 * - SSR/Node fallback mirrors `nextFrame`.
 * - If `signal` aborts before completion, the promise rejects with `AbortError`.
 */
export async function doubleFrame(opts?: t.TimeFrameOptions): Promise<void> {
  await nextFrame(opts);
  await nextFrame(opts);
}

/** Helpers */
function abortError() {
  return new DOMException('Aborted', 'AbortError');
}
