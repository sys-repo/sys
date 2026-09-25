import { errorText } from '../../m.Async.Schedule/-test/u.fixture.worker.ts';
import { scopeProbe } from './u.fixture.scope.ts';

type Input = { scoped?: boolean };
self.onmessage = (event: MessageEvent<Input | undefined>) => {
  void run(event.data?.scoped).then(
    (value) => self.postMessage({ ok: true, value }),
    (error: unknown) => self.postMessage({ ok: false, error: errorText(error) }),
  );
};

async function run(scoped = false) {
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
    ...scoped ? ['parent-throw', 'parent-reject'] as const : [],
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

  {
    using listeners = new DisposableStack();
    globalThis.addEventListener('error', onError);
    listeners.defer(() => globalThis.removeEventListener('error', onError));
    globalThis.addEventListener('unhandledrejection', onRejection);
    listeners.defer(() => globalThis.removeEventListener('unhandledrejection', onRejection));

    for (const queue of ['micro', 'macro'] as const) {
      for (const outcome of outcomes) {
        await using cleanup = new AsyncDisposableStack();
        const parent = cleanup.use(scoped ? scopeProbe() : undefined);
        const ctrl = cleanup.adopt(new AbortController(), (ctrl) => ctrl.abort());
        const errorCount = errors.length;
        const rejectionCount = rejections.length;
        const admitted = Promise.withResolvers<void>();
        const completion = Promise.withResolvers<void>();
        const failure = outcome === 'throw-undefined' ? undefined : { kind: 'callback.failure' };
        const asyncFailure = outcome === 'reject' || outcome === 'cancel-reject' ||
          outcome === 'abort-reject' || outcome === 'parent-reject';
        const callback = () => {
          admitted.resolve();
          if (outcome === 'cancel-throw') delay.cancel();
          if (outcome === 'abort-throw') ctrl.abort();
          if (outcome === 'parent-throw') parent?.scope.dispose();
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
        const create = parent?.scope.delay ?? (queue === 'micro' ? Time.Delay.create : Time.delay);
        const delay = queue === 'micro'
          ? create(callback, ctrl.signal)
          : create(0, callback, ctrl.signal);
        // Observe before admission; only internal leaks reach the host listeners.
        const observed = delay.then(
          () => ({ rejected: false, originalFailure: false }),
          (error: unknown) => ({ rejected: true, originalFailure: error === failure }),
        );
        cleanup.defer(async () => {
          completion.resolve();
          await observed;
        });
        cleanup.defer(() => delay.cancel());

        await admitted.promise;
        if (outcome === 'cancel-reject') delay.cancel();
        if (outcome === 'abort-reject') ctrl.abort();
        if (outcome === 'parent-reject') parent?.scope.dispose();
        if (asyncFailure) completion.reject(failure);
        const result = await observed;
        // Capture bridge release before fixture cancellation or parent disposal can repair it.
        const parentSubscriptions = parent?.active;
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
          ...parent ? { parentSubscriptions, parentDisposed: parent.scope.disposed } : {},
        });
      }
    }
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
