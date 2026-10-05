import type { t } from '../common.ts';

/** Wait for completed or failed disposal without initiating it. */
export function waitForDispose(life: t.LifecycleAsync): Promise<void> {
  if (life.disposed) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const sub = life.dispose$.subscribe((e) => {
      const stage = e.payload.stage;
      if (stage === 'complete' || stage === 'error') {
        sub.unsubscribe();
        resolve();
      }
    });
  });
}
