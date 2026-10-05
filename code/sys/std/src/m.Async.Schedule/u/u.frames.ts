import type { t } from '../common.ts';

/**
 * Await a normalized number of sequential frame hops.
 * @internal
 */
export async function frames(count: number, raf: t.ScheduleFn) {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  for (let i = 0; i < n; i += 1) await raf();
}
