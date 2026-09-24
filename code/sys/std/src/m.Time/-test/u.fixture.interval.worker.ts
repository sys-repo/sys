import {
  errorText,
  replaceValue,
  requiredDescriptor,
  restoreDescriptor,
} from '../../m.Async.Schedule/-test/u.fixture.worker.ts';
import { Is, type t } from '../common.ts';
import { abortProbe } from './u.fixture.abort.ts';

type Outcome =
  | 'throw'
  | 'throw-value'
  | 'throw-undefined'
  | 'abort-throw'
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
type Input = { immediate: boolean; outcome: Outcome };
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

async function run({ immediate, outcome }: Input) {
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
  const clean = () => timers.size === 0 && probe.removed === probe.added;
  const snapshot = () => ({
    is: handle ? { ...handle.is } : null,
    callbackCalls,
    timerCalls,
    pendingTimers: timers.size,
    listenersAdded: probe.added,
    listenersRemoved: probe.removed,
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

  let result;
  try {
    replaceValue(globalThis, 'setInterval', setDescriptor, trackedSet);
    replaceValue(globalThis, 'clearInterval', clearDescriptor, trackedClear);
    globalThis.addEventListener('error', onError);
    globalThis.addEventListener('unhandledrejection', onRejection);
    const { Time } = await import('../mod.ts');
    const callback = () => {
      callbackCalls += 1;
      admitted.resolve();
      if (outcome === 'abort-throw') probe.ctrl.abort();
      if (outcome === 'cancel-throw' || outcome === 'cancel-thenable') handle?.cancel();
      switch (outcome) {
        case 'throw':
        case 'throw-value':
        case 'throw-undefined':
        case 'abort-throw':
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
      handle = Time.interval(1, callback, { immediate, signal: probe.ctrl.signal });
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
    result = {
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
    };
  } finally {
    try {
      handle?.cancel();
    } finally {
      try {
        probe.ctrl.abort();
      } finally {
        completion.resolve();
        for (const id of timers) nativeClear(id);
        restoreDescriptor(globalThis, 'setInterval', setDescriptor);
        restoreDescriptor(globalThis, 'clearInterval', clearDescriptor);
        globalThis.removeEventListener('error', onError);
        globalThis.removeEventListener('unhandledrejection', onRejection);
      }
    }
  }

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
