import type { t } from '../common.ts';
import {
  errorText,
  replaceOptionalValue,
  replaceValue,
  requiredDescriptor,
  restoreDescriptor,
  sameDescriptor,
} from './u.fixture.worker.ts';

type Scenario =
  | 'ambientReplacement'
  | 'fallbackAuthority'
  | 'capturedBinding'
  | 'capturedRaf'
  | 'capturedRafFallback'
  | 'hostCallbackErrors'
  | 'fallbackCallbackError'
  | 'eventTimeoutCleanup'
  | 'queueFailures'
  | 'queueFallbackFailures'
  | 'queueCapturedTimerFailures'
  | 'queueFallbackCapturedTimerFailures'
  | 'queueCleanupFailure';

type AsyncModule = typeof import('@sys/std/async');
type CleanupState = { listenerActive: boolean; timerActive: boolean };

self.onmessage = (event: MessageEvent<Scenario>) => {
  void run(event.data).then(
    (value) => self.postMessage({ ok: true, value }),
    (error: unknown) => self.postMessage({ ok: false, error: errorText(error) }),
  );
};

async function run(scenario: Scenario): Promise<unknown> {
  switch (scenario) {
    case 'ambientReplacement':
      return await ambientReplacement();
    case 'fallbackAuthority':
      return await fallbackAuthority();
    case 'capturedBinding':
      return await capturedBinding();
    case 'capturedRaf':
      return await capturedRaf();
    case 'capturedRafFallback':
      return await capturedRafFallback();
    case 'hostCallbackErrors':
      return await hostCallbackErrors();
    case 'fallbackCallbackError':
      return await fallbackCallbackError();
    case 'eventTimeoutCleanup':
      return await eventTimeoutCleanup();
    case 'queueFailures':
      return await queueFailures(false, false);
    case 'queueFallbackFailures':
      return await queueFailures(true, false);
    case 'queueCapturedTimerFailures':
      return await queueFailures(false, true);
    case 'queueFallbackCapturedTimerFailures':
      return await queueFailures(true, true);
    case 'queueCleanupFailure':
      return await queueCleanupFailure();
  }
}

async function ambientReplacement() {
  const CapturedPromise = Promise;
  const CapturedQueueMicrotask = globalThis.queueMicrotask;
  const CapturedSetTimeout = globalThis.setTimeout;
  const promiseDescriptor = requiredDescriptor(globalThis, 'Promise');
  const queueDescriptor = requiredDescriptor(globalThis, 'queueMicrotask');
  const timeoutDescriptor = requiredDescriptor(globalThis, 'setTimeout');
  const constructorDescriptor = requiredDescriptor(CapturedPromise.prototype, 'constructor');
  const speciesDescriptor = requiredDescriptor(CapturedPromise, Symbol.species);
  const { Schedule } = await import('@sys/std/async');
  let ambientPromiseCalls = 0;
  let ambientQueueCalls = 0;
  let ambientTimerCalls = 0;
  let callbackCalls = 0;
  let constructorReads = 0;
  let speciesReads = 0;
  let callbacksReturnedUndefined = false;
  let macro: Promise<void> | undefined;
  let micro: Promise<void> | undefined;
  let macroHasOwnConstructor = false;
  let macroUsesCapturedPrototype = false;
  let microHasOwnConstructor = false;
  let microUsesCapturedPrototype = false;

  try {
    replaceValue(
      globalThis,
      'Promise',
      promiseDescriptor,
      class {
        constructor() {
          ambientPromiseCalls += 1;
          throw new Error('ambient Promise constructor invoked');
        }
      },
    );
    replaceValue(globalThis, 'queueMicrotask', queueDescriptor, (callback: VoidFunction) => {
      ambientQueueCalls += 1;
      Reflect.apply(CapturedQueueMicrotask, globalThis, [callback]);
    });
    replaceValue(
      globalThis,
      'setTimeout',
      timeoutDescriptor,
      ((...args: Parameters<typeof setTimeout>) => {
        ambientTimerCalls += 1;
        return Reflect.apply(CapturedSetTimeout, globalThis, args);
      }) as typeof setTimeout,
    );
    Object.defineProperty(CapturedPromise.prototype, 'constructor', {
      configurable: constructorDescriptor.configurable,
      enumerable: constructorDescriptor.enumerable,
      get() {
        constructorReads += 1;
        throw new Error('Promise.prototype.constructor read');
      },
    });
    Object.defineProperty(CapturedPromise, Symbol.species, {
      configurable: speciesDescriptor.configurable,
      enumerable: speciesDescriptor.enumerable,
      get() {
        speciesReads += 1;
        throw new Error('Promise species read');
      },
    });

    const microCallback = Schedule.micro(() => callbackCalls += 1);
    const macroCallback = Schedule.macro(() => callbackCalls += 1);
    micro = Schedule.micro();
    macro = Schedule.macro();
    callbacksReturnedUndefined = microCallback === undefined && macroCallback === undefined;
    macroHasOwnConstructor = Object.getOwnPropertyDescriptor(macro, 'constructor') !== undefined;
    macroUsesCapturedPrototype = Object.getPrototypeOf(macro) === CapturedPromise.prototype;
    microHasOwnConstructor = Object.getOwnPropertyDescriptor(micro, 'constructor') !== undefined;
    microUsesCapturedPrototype = Object.getPrototypeOf(micro) === CapturedPromise.prototype;
  } finally {
    Object.defineProperty(CapturedPromise, Symbol.species, speciesDescriptor);
    Object.defineProperty(CapturedPromise.prototype, 'constructor', constructorDescriptor);
    Object.defineProperty(globalThis, 'setTimeout', timeoutDescriptor);
    Object.defineProperty(globalThis, 'queueMicrotask', queueDescriptor);
    Object.defineProperty(globalThis, 'Promise', promiseDescriptor);
  }

  if (!micro || !macro) throw new Error('Captured queues did not return awaitable hops.');
  await Promise.all([micro, macro]);
  return {
    ambientPromiseCalls,
    ambientQueueCalls,
    ambientTimerCalls,
    callbackCalls,
    callbacksReturnedUndefined,
    constructorReads,
    descriptorsRestored:
      sameDescriptor(Object.getOwnPropertyDescriptor(globalThis, 'Promise'), promiseDescriptor) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(globalThis, 'queueMicrotask'),
        queueDescriptor,
      ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(globalThis, 'setTimeout'),
        timeoutDescriptor,
      ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(CapturedPromise.prototype, 'constructor'),
        constructorDescriptor,
      ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(CapturedPromise, Symbol.species),
        speciesDescriptor,
      ),
    macroHasOwnConstructor,
    macroUsesCapturedPrototype,
    microHasOwnConstructor,
    microUsesCapturedPrototype,
    speciesReads,
  };
}

async function fallbackAuthority() {
  const CapturedPromise = Promise;
  const CapturedQueueMicrotask = globalThis.queueMicrotask;
  const promiseDescriptor = requiredDescriptor(globalThis, 'Promise');
  const queueDescriptor = requiredDescriptor(globalThis, 'queueMicrotask');
  const constructorDescriptor = requiredDescriptor(CapturedPromise.prototype, 'constructor');
  const speciesDescriptor = requiredDescriptor(CapturedPromise, Symbol.species);
  const Schedule = await loadWithoutQueueMicrotask(queueDescriptor);
  let ambientPromiseCalls = 0;
  let ambientQueueCalls = 0;
  let callbackCalls = 0;
  let constructorReads = 0;
  let speciesReads = 0;
  let callbackReturnedUndefined = false;
  let hop: Promise<void> | undefined;
  let hopHasOwnConstructor = false;
  let hopUsesCapturedPrototype = false;

  try {
    replaceValue(
      globalThis,
      'Promise',
      promiseDescriptor,
      class {
        constructor() {
          ambientPromiseCalls += 1;
          throw new Error('ambient Promise constructor invoked');
        }
      },
    );
    replaceValue(globalThis, 'queueMicrotask', queueDescriptor, (callback: VoidFunction) => {
      ambientQueueCalls += 1;
      Reflect.apply(CapturedQueueMicrotask, globalThis, [callback]);
    });
    Object.defineProperty(CapturedPromise.prototype, 'constructor', {
      configurable: constructorDescriptor.configurable,
      enumerable: constructorDescriptor.enumerable,
      get() {
        constructorReads += 1;
        throw new Error('Promise.prototype.constructor read');
      },
    });
    Object.defineProperty(CapturedPromise, Symbol.species, {
      configurable: speciesDescriptor.configurable,
      enumerable: speciesDescriptor.enumerable,
      get() {
        speciesReads += 1;
        throw new Error('Promise species read');
      },
    });

    callbackReturnedUndefined = Schedule.micro(() => callbackCalls += 1) === undefined;
    hop = Schedule.micro();
    hopHasOwnConstructor = Object.getOwnPropertyDescriptor(hop, 'constructor') !== undefined;
    hopUsesCapturedPrototype = Object.getPrototypeOf(hop) === CapturedPromise.prototype;
  } finally {
    Object.defineProperty(CapturedPromise, Symbol.species, speciesDescriptor);
    Object.defineProperty(CapturedPromise.prototype, 'constructor', constructorDescriptor);
    Object.defineProperty(globalThis, 'queueMicrotask', queueDescriptor);
    Object.defineProperty(globalThis, 'Promise', promiseDescriptor);
  }

  if (!hop) throw new Error('Fallback did not return an awaitable hop.');
  await hop;
  return {
    ambientPromiseCalls,
    ambientQueueCalls,
    callbackCalls,
    callbackReturnedUndefined,
    constructorReads,
    descriptorsRestored:
      sameDescriptor(Object.getOwnPropertyDescriptor(globalThis, 'Promise'), promiseDescriptor) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(globalThis, 'queueMicrotask'),
        queueDescriptor,
      ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(CapturedPromise.prototype, 'constructor'),
        constructorDescriptor,
      ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(CapturedPromise, Symbol.species),
        speciesDescriptor,
      ),
    hopHasOwnConstructor,
    hopUsesCapturedPrototype,
    speciesReads,
  };
}

async function capturedBinding() {
  const OriginalPromise = Promise;
  const promiseDescriptor = requiredDescriptor(globalThis, 'Promise');
  class CapturedPromise<T> extends OriginalPromise<T> {}
  let result:
    | {
      macroUsesCapturedPrototype: boolean;
      macroUsesOriginalPrototype: boolean;
      microUsesCapturedPrototype: boolean;
      microUsesOriginalPrototype: boolean;
      rafUsesCapturedPrototype: boolean;
      rafUsesOriginalPrototype: boolean;
    }
    | undefined;

  try {
    replaceValue(globalThis, 'Promise', promiseDescriptor, CapturedPromise);
    const { Schedule } = await import('@sys/std/async');
    const micro = Schedule.micro();
    const macro = Schedule.macro();
    const raf = Schedule.raf();
    result = {
      macroUsesCapturedPrototype: Object.getPrototypeOf(macro) === CapturedPromise.prototype,
      macroUsesOriginalPrototype: Object.getPrototypeOf(macro) === OriginalPromise.prototype,
      microUsesCapturedPrototype: Object.getPrototypeOf(micro) === CapturedPromise.prototype,
      microUsesOriginalPrototype: Object.getPrototypeOf(micro) === OriginalPromise.prototype,
      rafUsesCapturedPrototype: Object.getPrototypeOf(raf) === CapturedPromise.prototype,
      rafUsesOriginalPrototype: Object.getPrototypeOf(raf) === OriginalPromise.prototype,
    };
    await Promise.all([micro, macro, raf]);
  } finally {
    Object.defineProperty(globalThis, 'Promise', promiseDescriptor);
  }

  if (!result) throw new Error('Captured Promise scenario did not complete.');
  return {
    ...result,
    descriptorRestored: sameDescriptor(
      Object.getOwnPropertyDescriptor(globalThis, 'Promise'),
      promiseDescriptor,
    ),
  };
}

async function capturedRaf() {
  const CapturedPromise = Promise;
  const CapturedSetTimeout = globalThis.setTimeout;
  const timeoutDescriptor = requiredDescriptor(globalThis, 'setTimeout');
  const rafDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  let ambientRafCalls = 0;
  let ambientTimerCalls = 0;
  let callbackCalls = 0;
  let capturedRafCalls = 0;
  let callbackReturnedUndefined = false;
  let hop: Promise<void> | undefined;
  let hopHasOwnConstructor = false;
  let hopUsesCapturedPrototype = false;

  replaceOptionalValue(
    globalThis,
    'requestAnimationFrame',
    rafDescriptor,
    (callback: FrameRequestCallback) => {
      capturedRafCalls += 1;
      Reflect.apply(CapturedSetTimeout, globalThis, [() => callback(performance.now()), 0]);
      return capturedRafCalls;
    },
  );

  try {
    const { Schedule } = await import('@sys/std/async');
    replaceOptionalValue(
      globalThis,
      'requestAnimationFrame',
      Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'),
      (callback: FrameRequestCallback) => {
        ambientRafCalls += 1;
        Reflect.apply(CapturedSetTimeout, globalThis, [() => callback(performance.now()), 0]);
        return ambientRafCalls;
      },
    );
    replaceValue(
      globalThis,
      'setTimeout',
      timeoutDescriptor,
      ((...args: Parameters<typeof setTimeout>) => {
        ambientTimerCalls += 1;
        return Reflect.apply(CapturedSetTimeout, globalThis, args);
      }) as typeof setTimeout,
    );

    callbackReturnedUndefined = Schedule.raf(() => callbackCalls += 1) === undefined;
    hop = Schedule.raf();
    hopHasOwnConstructor = Object.getOwnPropertyDescriptor(hop, 'constructor') !== undefined;
    hopUsesCapturedPrototype = Object.getPrototypeOf(hop) === CapturedPromise.prototype;
  } finally {
    Object.defineProperty(globalThis, 'setTimeout', timeoutDescriptor);
    restoreDescriptor(globalThis, 'requestAnimationFrame', rafDescriptor);
  }

  if (!hop) throw new Error('Captured RAF did not return an awaitable hop.');
  await hop;
  return {
    ambientRafCalls,
    ambientTimerCalls,
    callbackCalls,
    callbackReturnedUndefined,
    capturedRafCalls,
    descriptorsRestored: sameDescriptor(
      Object.getOwnPropertyDescriptor(globalThis, 'setTimeout'),
      timeoutDescriptor,
    ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'),
        rafDescriptor,
      ),
    hopHasOwnConstructor,
    hopUsesCapturedPrototype,
  };
}

async function capturedRafFallback() {
  const CapturedPromise = Promise;
  const CapturedSetTimeout = globalThis.setTimeout;
  const timeoutDescriptor = requiredDescriptor(globalThis, 'setTimeout');
  const rafDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  let ambientRafCalls = 0;
  let ambientTimerCalls = 0;
  let callbackCalls = 0;
  let callbackReturnedUndefined = false;
  let hop: Promise<void> | undefined;
  let hopHasOwnConstructor = false;
  let hopUsesCapturedPrototype = false;

  replaceOptionalValue(globalThis, 'requestAnimationFrame', rafDescriptor, null);

  try {
    const { Schedule } = await import('@sys/std/async');
    replaceOptionalValue(
      globalThis,
      'requestAnimationFrame',
      Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'),
      (callback: FrameRequestCallback) => {
        ambientRafCalls += 1;
        Reflect.apply(CapturedSetTimeout, globalThis, [() => callback(performance.now()), 0]);
        return ambientRafCalls;
      },
    );
    replaceValue(
      globalThis,
      'setTimeout',
      timeoutDescriptor,
      ((...args: Parameters<typeof setTimeout>) => {
        ambientTimerCalls += 1;
        return Reflect.apply(CapturedSetTimeout, globalThis, args);
      }) as typeof setTimeout,
    );

    callbackReturnedUndefined = Schedule.raf(() => callbackCalls += 1) === undefined;
    hop = Schedule.raf();
    hopHasOwnConstructor = Object.getOwnPropertyDescriptor(hop, 'constructor') !== undefined;
    hopUsesCapturedPrototype = Object.getPrototypeOf(hop) === CapturedPromise.prototype;
  } finally {
    Object.defineProperty(globalThis, 'setTimeout', timeoutDescriptor);
    restoreDescriptor(globalThis, 'requestAnimationFrame', rafDescriptor);
  }

  if (!hop) throw new Error('Captured RAF fallback did not return an awaitable hop.');
  await hop;
  return {
    ambientRafCalls,
    ambientTimerCalls,
    callbackCalls,
    callbackReturnedUndefined,
    descriptorsRestored: sameDescriptor(
      Object.getOwnPropertyDescriptor(globalThis, 'setTimeout'),
      timeoutDescriptor,
    ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'),
        rafDescriptor,
      ),
    hopHasOwnConstructor,
    hopUsesCapturedPrototype,
  };
}

async function hostCallbackErrors() {
  const { Schedule } = await import('@sys/std/async');
  const microFailure = new Error('micro callback failure');
  const macroFailure = new Error('macro callback failure');
  const cleanup: CleanupState = { listenerActive: false, timerActive: false };

  const returned = await observeValues(
    'error',
    new Set([microFailure, macroFailure]),
    (event) => (event as ErrorEvent).error,
    () => ({
      macroReturnedUndefined: Schedule.macro(() => {
        throw macroFailure;
      }) === undefined,
      microReturnedUndefined: Schedule.micro(() => {
        throw microFailure;
      }) === undefined,
    }),
    cleanup,
  );

  return {
    macroFailurePreserved: true,
    macroReturnedUndefined: returned.macroReturnedUndefined,
    microFailurePreserved: true,
    microReturnedUndefined: returned.microReturnedUndefined,
    listenerActiveAfterCleanup: cleanup.listenerActive,
    timerActiveAfterCleanup: cleanup.timerActive,
  };
}

async function fallbackCallbackError() {
  const queueDescriptor = requiredDescriptor(globalThis, 'queueMicrotask');
  const Schedule = await loadWithoutQueueMicrotask(queueDescriptor);
  const failure = new Error('fallback callback failure');
  const cleanup: CleanupState = { listenerActive: false, timerActive: false };

  const returnedUndefined = await observeValues(
    'unhandledrejection',
    new Set([failure]),
    (event) => (event as PromiseRejectionEvent).reason,
    () =>
      Schedule.micro(() => {
        throw failure;
      }) === undefined,
    cleanup,
  );

  return {
    failurePreserved: true,
    listenerActiveAfterCleanup: cleanup.listenerActive,
    returnedUndefined,
    timerActiveAfterCleanup: cleanup.timerActive,
  };
}

async function eventTimeoutCleanup() {
  const cleanup: CleanupState = { listenerActive: false, timerActive: false };
  let timedOut = false;

  try {
    await observeValues(
      'error',
      new Set([new Error('event that will not occur')]),
      (event) => (event as ErrorEvent).error,
      () => undefined,
      cleanup,
      5,
    );
  } catch (error) {
    timedOut = error instanceof Error && error.message === 'Host events were not observed.';
  }

  return {
    listenerActiveAfterCleanup: cleanup.listenerActive,
    timedOut,
    timerActiveAfterCleanup: cleanup.timerActive,
  };
}

async function queueFailures(fallback: boolean, replaceTimer: boolean) {
  const hostTimer = globalThis.setTimeout;
  const timerDescriptor = requiredDescriptor(globalThis, 'setTimeout');
  const queueDescriptor = requiredDescriptor(globalThis, 'queueMicrotask');
  const Schedule = fallback
    ? await loadWithoutQueueMicrotask(queueDescriptor)
    : (await import('@sys/std/async')).Schedule;
  const { Is } = await import('../common.ts');
  const queues: readonly { name: string; config: t.ScheduleQueueConfig }[] = [
    { name: 'micro', config: 'micro' },
    { name: 'raf', config: 'raf' },
    { name: 'zero-frames', config: { frames: 0 } },
    { name: 'frames', config: { frames: 2 } },
    { name: 'ms', config: { ms: 0 } },
  ];
  const outcomes = [
    'throw',
    'reject',
    'dispose-during',
    'self-dispose',
    'throw-value',
    'reject-undefined',
    'observer-throw',
    'observer-reject',
    'teardown-throw',
    'teardown-reject',
  ] as const;
  let ambientTimerCalls = 0;
  const results = [];

  try {
    if (replaceTimer) {
      replaceValue(
        globalThis,
        'setTimeout',
        timerDescriptor,
        ((...args: Parameters<typeof setTimeout>) => {
          ambientTimerCalls += 1;
          return Reflect.apply(hostTimer, globalThis, args);
        }) as typeof setTimeout,
      );
    }

    for (const queue of queues) {
      for (const outcome of outcomes) {
        const throws = outcome === 'throw' || outcome === 'throw-value' ||
          outcome === 'observer-throw' || outcome === 'teardown-throw';
        const observerFails = outcome === 'observer-throw' || outcome === 'observer-reject';
        const teardownFails = outcome === 'teardown-throw' || outcome === 'teardown-reject';
        const disposalFailure = new Error('disposal failure');
        const failure = outcome === 'throw-value'
          ? { kind: 'queue.failure' }
          : outcome === 'reject-undefined'
          ? undefined
          : new Error(`${queue.name}: ${outcome}`);
        const admitted = Promise.withResolvers<void>();
        const completion = Promise.withResolvers<void>();
        const errors: unknown[] = [];
        const rejections: unknown[] = [];
        const disposalAtError: boolean[] = [];
        const turnAtError: boolean[] = [];
        const timers = new Set<ReturnType<typeof setTimeout>>();
        let taskCalls = 0;
        let disposeCalls = 0;
        let disposalTurn = false;
        let pendingFixtureTimers = 0;
        let life: t.Lifecycle | undefined;

        // Independent host turns keep both observers alive beyond report dispatch.
        const enqueue = (callback: () => void) => {
          const timer = hostTimer(() => {
            timers.delete(timer);
            callback();
          }, 0);
          timers.add(timer);
        };
        const nextTurn = () => new Promise<void>((resolve) => enqueue(resolve));
        const onError = (event: ErrorEvent) => {
          event.preventDefault();
          errors.push(event.error);
          if (event.error === failure) {
            disposalAtError.push(life?.disposed === true && disposeCalls === 1);
            turnAtError.push(disposalTurn);
          }
        };
        const onRejection = (event: PromiseRejectionEvent) => {
          event.preventDefault();
          rejections.push(event.reason);
        };

        try {
          globalThis.addEventListener('error', onError);
          globalThis.addEventListener('unhandledrejection', onRejection);
          life = Schedule.queue(() => {
            taskCalls += 1;
            admitted.resolve();
            if (outcome === 'self-dispose') life?.dispose();
            if (throws) throw failure;
            return completion.promise;
          }, queue.config);
          life.dispose$.subscribe(() => {
            disposeCalls += 1;
            enqueue(() => disposalTurn = true);
          });
          if (observerFails) {
            life.dispose$.subscribe(() => {
              throw disposalFailure;
            });
          }
          if (teardownFails) {
            life.dispose$.subscribe().add(() => {
              throw disposalFailure;
            });
          }

          await admitted.promise;
          if (outcome === 'dispose-during') {
            life.dispose();
            life.dispose();
          }
          if (!throws) completion.reject(failure);
          await Promise.resolve();
          // Assert settlement before the fixture can supply disposal itself.
          if (!life.disposed || disposeCalls !== 1) {
            throw new Error(`${queue.name}: ${outcome}: Queue did not dispose once at settlement.`);
          }
          life.dispose();
          life.dispose();
          await nextTurn();
          await nextTurn();
        } finally {
          pendingFixtureTimers = timers.size;
          cleanupQueueFixture(life, onError, onRejection, timers);
        }

        // Synthetic sentinels test removal without creating another real host failure.
        const observedCount = errors.length + rejections.length;
        const errorDetached = globalThis.dispatchEvent(new Event('error', { cancelable: true }));
        const rejectionDetached = globalThis.dispatchEvent(
          new Event('unhandledrejection', { cancelable: true }),
        );
        const listenersDetached = errorDetached && rejectionDetached &&
          errors.length + rejections.length === observedCount;
        const rejection = rejections[0];
        const disposalRejectionPreserved = rejections.length === 1 && Is.record(rejection) &&
          rejection.name === 'UnsubscriptionError' && Is.array(rejection.errors) &&
          rejection.errors.length === 1 && rejection.errors[0] === disposalFailure;

        results.push({
          queue: queue.name,
          outcome,
          taskCalls,
          disposeCalls,
          errorCount: errors.length,
          rejectionCount: rejections.length,
          originalFailure: errors.filter((error) => error === failure).length === 1,
          disposalErrorCount: errors.filter((error) => error === disposalFailure).length,
          disposalRejectionPreserved,
          disposedBeforeError: disposalAtError.length === 1 && disposalAtError[0],
          reportAfterDisposalTurn: turnAtError.length === 1 && turnAtError[0],
          listenersDetached,
          pendingFixtureTimers,
        });
      }
    }
  } finally {
    Object.defineProperty(globalThis, 'setTimeout', timerDescriptor);
    Object.defineProperty(globalThis, 'queueMicrotask', queueDescriptor);
  }

  return {
    results,
    ambientTimerCalls,
    descriptorsRestored:
      sameDescriptor(Object.getOwnPropertyDescriptor(globalThis, 'setTimeout'), timerDescriptor) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(globalThis, 'queueMicrotask'),
        queueDescriptor,
      ),
  };
}

async function queueCleanupFailure() {
  const { Schedule } = await import('@sys/std/async');
  const { Is } = await import('../common.ts');
  const failure = new Error('fixture teardown failure');
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let taskCalls = 0;
  let timerCalls = 0;
  let eventCalls = 0;
  let disposalFailurePreserved = false;
  const onEvent = (event: Event) => {
    event.preventDefault();
    eventCalls += 1;
  };
  const enqueue = () => timers.add(setTimeout(() => timerCalls += 1, 0));
  const life = Schedule.queue(() => taskCalls += 1);
  life.dispose$.subscribe(enqueue).add(() => {
    throw failure;
  });

  try {
    globalThis.addEventListener('error', onEvent);
    globalThis.addEventListener('unhandledrejection', onEvent);
    enqueue();
    try {
      cleanupQueueFixture(life, onEvent, onEvent, timers);
    } catch (error) {
      disposalFailurePreserved = Is.record(error) && error.name === 'UnsubscriptionError' &&
        Is.array(error.errors) && error.errors.length === 1 && error.errors[0] === failure;
    }

    const errorDetached = globalThis.dispatchEvent(new Event('error', { cancelable: true }));
    const rejectionDetached = globalThis.dispatchEvent(
      new Event('unhandledrejection', { cancelable: true }),
    );
    // Both the existing timer and the timer acquired during disposal must be cancelled.
    await Schedule.macro();
    return {
      disposed: life.disposed,
      disposalFailurePreserved,
      listenersDetached: errorDetached && rejectionDetached && eventCalls === 0,
      taskCalls,
      timerCalls,
      pendingFixtureTimers: timers.size,
    };
  } finally {
    globalThis.removeEventListener('error', onEvent);
    globalThis.removeEventListener('unhandledrejection', onEvent);
    for (const timer of timers) clearTimeout(timer);
  }
}

/** Release fixture listeners and timers even when lifecycle disposal throws. */
function cleanupQueueFixture(
  life: t.Lifecycle | undefined,
  onError: (event: ErrorEvent) => void,
  onRejection: (event: PromiseRejectionEvent) => void,
  timers: Set<ReturnType<typeof setTimeout>>,
) {
  try {
    life?.dispose();
  } finally {
    globalThis.removeEventListener('error', onError);
    globalThis.removeEventListener('unhandledrejection', onRejection);
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  }
}

async function observeValues<T>(
  type: 'error' | 'unhandledrejection',
  expected: ReadonlySet<unknown>,
  select: (event: Event) => unknown,
  start: () => T,
  cleanup: CleanupState,
  timeoutMs = 500,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let started: T | undefined;
  const seen = new Set<unknown>();
  const onEvent: EventListener = (event) => {
    event.preventDefault();
    seen.add(select(event));
    if ([...expected].every((value) => seen.has(value))) resolveCompletion?.();
  };
  let resolveCompletion: (() => void) | undefined;

  try {
    await new Promise<void>((resolve, reject) => {
      resolveCompletion = resolve;
      globalThis.addEventListener(type, onEvent);
      cleanup.listenerActive = true;
      timer = setTimeout(() => reject(new Error('Host events were not observed.')), timeoutMs);
      cleanup.timerActive = true;
      started = start();
    });
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    cleanup.timerActive = false;
    if (cleanup.listenerActive) globalThis.removeEventListener(type, onEvent);
    cleanup.listenerActive = false;
  }

  return started as T;
}

async function loadWithoutQueueMicrotask(
  queueDescriptor: PropertyDescriptor,
): Promise<AsyncModule['Schedule']> {
  replaceValue(globalThis, 'queueMicrotask', queueDescriptor, undefined);
  try {
    const { Schedule } = await import('@sys/std/async');
    return Schedule;
  } finally {
    Object.defineProperty(globalThis, 'queueMicrotask', queueDescriptor);
  }
}
