import { errorText, restoreDescriptor, sameDescriptor } from './u.fixture.worker.ts';

self.onmessage = () => {
  void run().then(
    (value) => self.postMessage({ ok: true, value }),
    (error: unknown) => self.postMessage({ ok: false, error: errorText(error) }),
  );
};

async function run() {
  const CapturedQueueMicrotask = globalThis.queueMicrotask;
  const rafDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  let calls = 0;
  let result:
    | {
      defaultCount: number;
      fractionalCount: number;
      infiniteCount: number;
      nanCount: number;
      negativeCount: number;
      zeroCount: number;
    }
    | undefined;

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    enumerable: rafDescriptor?.enumerable ?? true,
    writable: true,
    value: (callback: FrameRequestCallback) => {
      calls += 1;
      Reflect.apply(CapturedQueueMicrotask, globalThis, [() => callback(performance.now())]);
      return calls;
    },
  });

  try {
    const { Schedule } = await import('@sys/std/async');
    result = {
      defaultCount: await countCalls(() => Schedule.frames()),
      zeroCount: await countCalls(() => Schedule.frames(0)),
      fractionalCount: await countCalls(() => Schedule.frames(2.9)),
      negativeCount: await countCalls(() => Schedule.frames(-5)),
      nanCount: await countCalls(() => Schedule.frames(Number.NaN)),
      infiniteCount: await countCalls(() => Schedule.frames(Number.POSITIVE_INFINITY)),
    };
  } finally {
    restoreDescriptor(globalThis, 'requestAnimationFrame', rafDescriptor);
  }

  if (!result) throw new Error('Public frame normalization did not complete.');
  return {
    ...result,
    descriptorRestored: sameDescriptor(
      Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame'),
      rafDescriptor,
    ),
  };

  async function countCalls(fn: () => Promise<void>): Promise<number> {
    const before = calls;
    await fn();
    return calls - before;
  }
}
