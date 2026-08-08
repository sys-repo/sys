import { Arr, Is, type t } from './common.ts';

/** Triggers every controllable disposal input in a test fixture. */
export function triggerUntil(until?: t.DisposeInput) {
  if (Is.disposable(until)) return until.dispose();
  if (Is.subject(until)) return until.next(undefined);
  if (!Is.array(until)) return;

  Arr.flatten<unknown>(until).forEach((item) => {
    if (Is.disposable(item)) item.dispose();
    else if (Is.subject(item)) item.next(undefined);
  });
}

/** Resolves after an asynchronous lifecycle reaches a terminal stage. */
export function waitForAsyncDispose(lifecycle: t.LifecycleAsync) {
  if (lifecycle.disposed) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const state: { terminal: boolean; subscription?: { unsubscribe(): void } } = {
      terminal: false,
    };
    const subscription = lifecycle.dispose$.subscribe((event) => {
      const { stage } = event.payload;
      if (stage !== 'complete' && stage !== 'error') return;

      state.terminal = true;
      state.subscription?.unsubscribe();
      resolve();
    });

    state.subscription = subscription;
    if (state.terminal) subscription.unsubscribe();
  });
}
