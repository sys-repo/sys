import { errorText } from '../../m.Async.Schedule/-test/u.fixture.worker.ts';

self.onmessage = () => {
  void run().then(
    (value) => self.postMessage({ ok: true, value }),
    (error: unknown) => self.postMessage({ ok: false, error: errorText(error) }),
  );
};

async function run() {
  const { Time } = await import('../mod.ts');
  const { Schedule } = await import('../../m.Async.Schedule/mod.ts');
  const outcomes = [
    'throw',
    'reject',
    'cancel-throw',
    'abort-throw',
    'cancel-reject',
    'abort-reject',
    'throw-undefined',
    'then-getter',
  ] as const;
  const errors: unknown[] = [];
  const rejections: unknown[] = [];
  const results = [];
  const onError = (event: ErrorEvent) => {
    event.preventDefault();
    errors.push(event.error);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    rejections.push(event.reason);
  };

  try {
    globalThis.addEventListener('error', onError);
    globalThis.addEventListener('unhandledrejection', onRejection);
    for (const queue of ['micro', 'macro'] as const) {
      for (const outcome of outcomes) {
        const errorCount = errors.length;
        const rejectionCount = rejections.length;
        const ctrl = new AbortController();
        const admitted = Promise.withResolvers<void>();
        const completion = Promise.withResolvers<void>();
        const failure = outcome === 'throw-undefined' ? undefined : { kind: 'callback.failure' };
        const asyncFailure = outcome === 'reject' || outcome === 'cancel-reject' ||
          outcome === 'abort-reject';
        const callback = () => {
          admitted.resolve();
          if (outcome === 'cancel-throw') delay.cancel();
          if (outcome === 'abort-throw') ctrl.abort();
          if (asyncFailure) return completion.promise;
          if (outcome === 'then-getter') {
            return {
              get then() {
                throw failure;
              },
            };
          }
          throw failure;
        };
        const delay = queue === 'micro'
          ? Time.Delay.create(callback, ctrl.signal)
          : Time.delay(0, callback, ctrl.signal);
        // Observe the public result before admission; only internal leaks reach the host listeners.
        const observed = delay.then(
          () => ({ rejected: false, originalFailure: false }),
          (error: unknown) => ({ rejected: true, originalFailure: error === failure }),
        );
        await admitted.promise;
        if (outcome === 'cancel-reject') delay.cancel();
        if (outcome === 'abort-reject') ctrl.abort();
        if (asyncFailure) completion.reject(failure);
        const result = await observed;
        delay.cancel();
        ctrl.abort();
        // Keep both channels observed through Queue's possible reporting turn.
        await Schedule.macro();
        await Schedule.macro();
        results.push({
          queue,
          outcome,
          ...result,
          is: { ...delay.is },
          hostErrors: errors.length - errorCount,
          hostRejections: rejections.length - rejectionCount,
        });
      }
    }
  } finally {
    globalThis.removeEventListener('error', onError);
    globalThis.removeEventListener('unhandledrejection', onRejection);
  }

  const observedCount = errors.length + rejections.length;
  const errorDetached = globalThis.dispatchEvent(new Event('error', { cancelable: true }));
  const rejectionDetached = globalThis.dispatchEvent(
    new Event('unhandledrejection', { cancelable: true }),
  );
  return {
    results,
    listenersDetached: errorDetached && rejectionDetached &&
      errors.length + rejections.length === observedCount,
  };
}
