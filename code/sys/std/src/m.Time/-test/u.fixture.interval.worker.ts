import {
  errorText,
  replaceValue,
  requiredDescriptor,
  restoreDescriptor,
} from '../../m.Async.Schedule/-test/u.fixture.worker.ts';
import { Is, type t } from '../common.ts';
import { abortProbe } from './u.fixture.abort.ts';
import { scopeProbe } from './u.fixture.scope.ts';

type Outcome =
  | 'throw'
  | 'throw-value'
  | 'throw-undefined'
  | 'abort-throw'
  | 'parent-throw'
  | 'parent-thenable'
  | 'cancel-throw'
  | 'resolve-promise'
  | 'reject-promise'
  | 'late-reject'
  | 'resolve-thenable'
  | 'reject-thenable'
  | 'throw-thenable'
  | 'double-settle'
  | 'function-thenable'
  | 'abort-then-getter'
  | 'throw-then-getter'
  | 'cancel-thenable'
  | 'async-then-reject'
  | 'async-then-resolve-reject'
  | 'async-then-reject-reject'
  | 'async-then-late-reject'
  | 'async-then-resolve-late-reject'
  | 'async-then-reject-late-reject';
type Input = { immediate: boolean; outcome: Outcome; scoped?: boolean };
type Then = (
  this: unknown,
  resolve: (value: unknown) => void,
  reject: (reason: unknown) => void,
) => unknown;

self.onmessage = (event: MessageEvent<Input>) => {
  void run(event.data).then(
    (value) => self.postMessage({ ok: true, value }),
    (error: unknown) => self.postMessage({ ok: false, error: errorText(error) }),
  );
};

async function run({ immediate, outcome, scoped }: Input) {
  using cleanup = new DisposableStack();
  const setDescriptor = requiredDescriptor(globalThis, 'setInterval');
  const clearDescriptor = requiredDescriptor(globalThis, 'clearInterval');
  const nativeSet = globalThis.setInterval.bind(globalThis);
  const nativeClear = globalThis.clearInterval.bind(globalThis);
  const timers = new Set<ReturnType<typeof setInterval>>();
  const probe = abortProbe();
  const admitted = Promise.withResolvers<void>();
  const completion = Promise.withResolvers<void>();
  const failure = outcome === 'throw-undefined'
    ? undefined
    : outcome === 'throw-value'
    ? { kind: 'interval.failure' }
    : new Error('interval callback failure');
  const errors: unknown[] = [];
  const rejections: unknown[] = [];
  const synchronous: unknown[] = [];
  const cleanAtReport: boolean[] = [];
  const flagsAtReport: (t.Time.Interval.Handle['is'] | null)[] = [];
  let handle: t.Time.Interval.Handle | undefined;
  let callbackCalls = 0;
  let timerCalls = 0;
  let timersCreated = 0;
  let thenReads = 0;
  let thenCalls = 0;
  let receiverPreserved = true;
  const clean = () =>
    timers.size === 0 && probe.removed === probe.added && (!parent || parent.active === 0);
  const snapshot = () => ({
    is: handle ? { ...handle.is } : null,
    callbackCalls,
    timerCalls,
    pendingTimers: timers.size,
    listenersAdded: probe.added,
    listenersRemoved: probe.removed,
    ...parent ? { parentSubscriptions: parent.active } : {},
  });
  const onError = (event: ErrorEvent) => {
    event.preventDefault();
    errors.push(event.error);
    cleanAtReport.push(clean());
    flagsAtReport.push(handle ? { ...handle.is } : null);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    rejections.push(event.reason);
  };

  const trackedSet = (handler: unknown, delay?: number, ...args: unknown[]) => {
    if (!Is.func(handler)) throw new Error('Interval fixture requires a function callback');
    const id = nativeSet(() => {
      timerCalls += 1;
      Reflect.apply(handler, globalThis, args);
    }, delay);
    cleanup.defer(() => nativeClear(id));
    timers.add(id);
    timersCreated += 1;
    return id;
  };
  const trackedClear = (id?: ReturnType<typeof setInterval>) => {
    nativeClear(id);
    if (id !== undefined) timers.delete(id);
  };

  const thenable = () => {
    const value = outcome === 'function-thenable' ? () => {} : {};
    const recordCall = (receiver: unknown) => {
      thenCalls += 1;
      receiverPreserved &&= receiver === value;
    };
    const method: Then = outcome.startsWith('async-then-')
      ? async function (resolve, reject) {
        recordCall(this);
        if (outcome.includes('-resolve-')) resolve(42);
        if (outcome.includes('-reject-')) reject(failure);
        if (outcome.includes('-late-')) await completion.promise;
        throw failure;
      }
      : function (resolve, reject) {
        recordCall(this);
        if (outcome === 'throw-thenable') throw failure;
        if (outcome === 'resolve-thenable') resolve(42);
        else if (outcome === 'double-settle') {
          resolve(42);
          reject(failure);
          throw failure;
        } else reject(failure);
      };
    Object.defineProperty(value, 'then', {
      get() {
        thenReads += 1;
        if (outcome === 'throw-then-getter') throw failure;
        if (outcome === 'abort-then-getter') probe.ctrl.abort();
        return method;
      },
    });
    return value;
  };

  // Register each restoration before replacing its global; later failures cannot skip earlier cleanup.
  cleanup.defer(() => restoreDescriptor(globalThis, 'setInterval', setDescriptor));
  replaceValue(globalThis, 'setInterval', setDescriptor, trackedSet);
  cleanup.defer(() => restoreDescriptor(globalThis, 'clearInterval', clearDescriptor));
  replaceValue(globalThis, 'clearInterval', clearDescriptor, trackedClear);
  globalThis.addEventListener('error', onError);
  cleanup.defer(() => globalThis.removeEventListener('error', onError));
  globalThis.addEventListener('unhandledrejection', onRejection);
  cleanup.defer(() => globalThis.removeEventListener('unhandledrejection', onRejection));
  const parent = cleanup.use(scoped ? scopeProbe() : undefined);
  cleanup.defer(() => completion.resolve());
  cleanup.defer(() => probe.ctrl.abort());
  cleanup.defer(() => handle?.cancel());

  const { Time } = await import('../mod.ts');
  const callback = () => {
    callbackCalls += 1;
    admitted.resolve();
    if (outcome === 'abort-throw') probe.ctrl.abort();
    if (outcome === 'parent-throw' || outcome === 'parent-thenable') parent?.scope.dispose();
    if (outcome === 'cancel-throw' || outcome === 'cancel-thenable') handle?.cancel();
    switch (outcome) {
      case 'throw':
      case 'throw-value':
      case 'throw-undefined':
      case 'abort-throw':
      case 'parent-throw':
      case 'cancel-throw':
        throw failure;
      case 'resolve-promise':
        return Promise.resolve(42);
      case 'reject-promise':
        return Promise.reject(failure);
      case 'late-reject':
        return completion.promise;
      default:
        return thenable();
    }
  };
  try {
    handle = (parent?.scope ?? Time).interval(1, callback, {
      immediate,
      signal: probe.ctrl.signal,
    });
  } catch (error) {
    synchronous.push(error);
    cleanAtReport.push(clean());
    flagsAtReport.push(handle ? { ...handle.is } : null);
  }
  await admitted.promise;
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  // Capture terminal truth before any fixture cancellation or borrowed-work settlement.
  const beforeRelease = snapshot();
  if (outcome === 'late-reject') completion.reject(failure);
  else completion.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 20));
  const afterWindow = snapshot();
  const callsBeforeSentinel = probe.calls;
  probe.ctrl.signal.dispatchEvent(new Event('abort'));
  const listenerDetached = probe.calls === callsBeforeSentinel;
  handle?.cancel();
  handle?.cancel();
  probe.ctrl.abort();
  const reported = [...synchronous, ...errors];
  const result = {
    synchronousErrors: synchronous.length,
    hostErrors: errors.length,
    hostRejections: rejections.length,
    originalFailure: reported.length === 1 && reported[0] === failure,
    contractTypeError: reported.length === 1 && reported[0] instanceof TypeError,
    cleanAtReport,
    flagsAtReport,
    beforeRelease,
    afterWindow,
    afterCancel: handle ? { ...handle.is } : null,
    listenerDetached,
    timersCreated,
    thenReads,
    thenCalls,
    receiverPreserved,
    ...parent ? { parentDisposed: parent.scope.disposed } : {},
  };

  // Fixture repair is deliberately later than every resource snapshot above.
  cleanup.dispose();
  const observedCount = errors.length + rejections.length;
  const errorDetached = globalThis.dispatchEvent(new Event('error', { cancelable: true }));
  const rejectionDetached = globalThis.dispatchEvent(
    new Event('unhandledrejection', { cancelable: true }),
  );
  return {
    ...result,
    hostListenersDetached: errorDetached && rejectionDetached &&
      errors.length + rejections.length === observedCount,
  };
}
