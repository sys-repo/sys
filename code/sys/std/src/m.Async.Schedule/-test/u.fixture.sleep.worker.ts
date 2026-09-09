import {
  errorText,
  replaceOptionalValue,
  replaceValue,
  requiredDescriptor,
  restoreDescriptor,
  sameDescriptor,
} from './u.fixture.worker.ts';

type HopCounts = { delays: number[]; microtasks: number; timers: number };

self.onmessage = () => {
  void run().then(
    (value) => self.postMessage({ ok: true, value }),
    (error: unknown) => self.postMessage({ ok: false, error: errorText(error) }),
  );
};

async function run() {
  const CapturedQueueMicrotask = globalThis.queueMicrotask;
  const CapturedSetTimeout = globalThis.setTimeout;
  const queueDescriptor = requiredDescriptor(globalThis, 'queueMicrotask');
  const timeoutDescriptor = requiredDescriptor(globalThis, 'setTimeout');
  const rafDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const timerDelays: number[] = [];
  let microtaskCalls = 0;
  let timerCalls = 0;
  let result:
    | {
      macro: HopCounts;
      micro: HopCounts;
      none: HopCounts;
      raf: HopCounts;
    }
    | undefined;

  replaceValue(globalThis, 'queueMicrotask', queueDescriptor, (callback: VoidFunction) => {
    microtaskCalls += 1;
    Reflect.apply(CapturedQueueMicrotask, globalThis, [callback]);
  });
  replaceValue(
    globalThis,
    'setTimeout',
    timeoutDescriptor,
    ((...args: Parameters<typeof setTimeout>) => {
      timerCalls += 1;
      timerDelays.push(Number(args[1] ?? 0));
      return Reflect.apply(CapturedSetTimeout, globalThis, args);
    }) as typeof setTimeout,
  );
  replaceOptionalValue(globalThis, 'requestAnimationFrame', rafDescriptor, null);

  try {
    const { Schedule } = await import('@sys/std/async');
    result = {
      none: await countHops(() => Schedule.sleep(0, false)),
      micro: await countHops(() => Schedule.sleep(0, 'micro')),
      macro: await countHops(() => Schedule.sleep(0, 'macro')),
      raf: await countHops(() => Schedule.sleep(0, 'raf')),
    };
  } finally {
    restoreDescriptor(globalThis, 'requestAnimationFrame', rafDescriptor);
    Object.defineProperty(globalThis, 'setTimeout', timeoutDescriptor);
    Object.defineProperty(globalThis, 'queueMicrotask', queueDescriptor);
  }

  if (!result) throw new Error('Public sleep hop observation did not complete.');
  return {
    ...result,
    descriptorsRestored: sameDescriptor(
      Object.getOwnPropertyDescriptor(globalThis, 'queueMicrotask'),
      queueDescriptor,
    ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(globalThis, 'setTimeout'),
        timeoutDescriptor,
      ) &&
      sameDescriptor(
        Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'),
        rafDescriptor,
      ),
  };

  async function countHops(fn: () => Promise<void>): Promise<HopCounts> {
    const beforeDelays = timerDelays.length;
    const beforeMicrotasks = microtaskCalls;
    const beforeTimers = timerCalls;
    await fn();
    return {
      delays: timerDelays.slice(beforeDelays),
      microtasks: microtaskCalls - beforeMicrotasks,
      timers: timerCalls - beforeTimers,
    };
  }
}
