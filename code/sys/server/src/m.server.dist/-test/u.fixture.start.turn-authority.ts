import { type t, WebFixture } from '../../-test.ts';

const NativeClearTimeout = globalThis.clearTimeout;
const NativePromise = Promise;
const NativeQueueMicrotask = globalThis.queueMicrotask;
const NativeSetTimeout = globalThis.setTimeout;
const apply = Reflect.apply;
const SETTLEMENT_TIMEOUT = 1_000;

type PropertyMock = ReturnType<typeof WebFixture.Property.mock>;

/**
 * Poison ambient turn authority after listener bind while retaining exact restoration control.
 */
export function createStartTurnAuthorityFixture() {
  let schedulerMutation: PropertyMock | undefined;
  let transportMutation: PropertyMock | undefined;
  let listenerFinished: Promise<void> | undefined;
  let ambientPromiseCalls = 0;
  let ambientQueueCalls = 0;
  let ambientTimerCalls = 0;
  let closeCalls = 0;
  let shutdownCalls = 0;
  let speciesReads = 0;
  let settled = false;

  const restorePromiseTransport = () => {
    if (!transportMutation) return;
    transportMutation.dispose();
    transportMutation = undefined;
  };

  return {
    bind(listener: t.HttpServer.Started): t.HttpServer.Started {
      if (listenerFinished) throw new Error('Turn-authority fixture already bound.');
      listenerFinished = listener.finished;
      void listener.finished.then(markSettled, markSettled);

      const close = listener.close.bind(listener);
      const shutdown = listener.server.shutdown.bind(listener.server);
      Object.defineProperty(listener, 'close', {
        configurable: true,
        enumerable: true,
        value: (reason?: unknown) => {
          closeCalls += 1;
          return close(reason);
        },
      });
      Object.defineProperty(listener.server, 'shutdown', {
        configurable: true,
        value: () => {
          shutdownCalls += 1;
          return shutdown();
        },
      });

      schedulerMutation = WebFixture.Property.mock([
        {
          target: globalThis,
          key: 'queueMicrotask',
          descriptor: {
            value: (callback: VoidFunction) => {
              ambientQueueCalls += 1;
              apply(NativeQueueMicrotask, globalThis, [callback]);
            },
          },
        },
        {
          target: globalThis,
          key: 'setTimeout',
          descriptor: {
            value: ((...args: Parameters<typeof setTimeout>) => {
              ambientTimerCalls += 1;
              return apply(NativeSetTimeout, globalThis, args);
            }) as typeof setTimeout,
          },
        },
      ]);
      transportMutation = WebFixture.Property.mock([
        {
          target: NativePromise,
          key: Symbol.species,
          descriptor: {
            get() {
              speciesReads += 1;
              throw new Error('Promise species accessor invoked.');
            },
          },
        },
        {
          target: globalThis,
          key: 'Promise',
          descriptor: {
            value: class {
              constructor() {
                ambientPromiseCalls += 1;
                throw new Error('Ambient Promise constructor invoked.');
              }
            },
          },
        },
      ]);
      return listener;
    },

    get settled(): boolean {
      return settled;
    },

    evidence() {
      return {
        ambientPromiseCalls,
        ambientQueueCalls,
        ambientTimerCalls,
        closeCalls,
        shutdownCalls,
        speciesReads,
      } as const;
    },

    restorePromiseTransport,

    async awaitListenerSettlement(): Promise<void> {
      const finished = listenerFinished;
      if (!finished) return;
      await new NativePromise<void>((resolve, reject) => {
        const timeout = NativeSetTimeout(
          () => reject(new Error('Listener rollback did not settle.')),
          SETTLEMENT_TIMEOUT,
        );
        const complete = () => {
          NativeClearTimeout(timeout);
          resolve();
        };
        void finished.then(complete, complete);
      });
    },

    dispose(): void {
      const failures: unknown[] = [];
      try {
        restorePromiseTransport();
      } catch (cause) {
        failures.push(cause);
      }
      try {
        schedulerMutation?.dispose();
        schedulerMutation = undefined;
      } catch (cause) {
        failures.push(cause);
      }
      if (failures.length === 1) throw failures[0];
      if (failures.length > 1) {
        throw new AggregateError(failures, 'Turn-authority fixture cleanup failed.');
      }
    },
  };

  function markSettled(): void {
    settled = true;
  }
}
