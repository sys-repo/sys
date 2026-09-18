import { describe, expect, it, type t } from '../../-test.ts';
import { DEFAULT_DEPENDENCIES, startWith } from '../u/u.start.ts';
import { catchCause, input } from './u.fixture.ts';

describe('BootstrapStatus.start/rollback', () => {
  it('rolls back a listener when its start dependency poisons Promise after bind', async () => {
    const speciesDescriptor = Object.getOwnPropertyDescriptor(Promise, Symbol.species);
    if (!speciesDescriptor) throw new Error('Expected Promise species descriptor.');
    let internalFinished: Promise<void> | undefined;
    let starts = 0;
    let closeCalls = 0;
    let speciesReads = 0;
    let failure: unknown;

    try {
      failure = await catchCause(() =>
        startWith(input(), {
          ...DEFAULT_DEPENDENCIES,
          startHttp(...args) {
            starts++;
            const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
            internalFinished = listener.finished;
            const close = listener.close.bind(listener);
            Object.defineProperty(listener, 'close', {
              configurable: true,
              enumerable: true,
              value: (reason?: unknown) => {
                closeCalls++;
                return close(reason);
              },
            });
            Object.defineProperty(Promise, Symbol.species, {
              configurable: true,
              get() {
                speciesReads++;
                throw new Error('Promise species accessor invoked');
              },
            });
            return listener;
          },
        })
      );
    } finally {
      Object.defineProperty(Promise, Symbol.species, speciesDescriptor);
    }

    if (!internalFinished) throw new Error('Expected internal listener completion.');
    await internalFinished;
    expect(failure).to.be.instanceOf(Error);
    expect((failure as Error).message).to.eql('BootstrapStatus.start failed.');
    expect({ starts, closeCalls, speciesReads }).to.eql({
      starts: 1,
      closeCalls: 1,
      speciesReads: 0,
    });
  });

  it('retains an unobservable rollback operation without retrying it', async () => {
    const operation = Promise.withResolvers<void>();
    let constructorReads = 0;
    Object.defineProperty(operation.promise, 'constructor', {
      configurable: true,
      get() {
        constructorReads++;
        throw new Error('rollback constructor invoked');
      },
    });
    let listener: t.HttpServer.Started | undefined;
    let originalShutdown: (() => Promise<void>) | undefined;
    let closeCalls = 0;
    let shutdownCalls = 0;

    const failure = await catchCause(() =>
      startWith(input(), {
        ...DEFAULT_DEPENDENCIES,
        startHttp(...args) {
          listener = DEFAULT_DEPENDENCIES.startHttp(...args);
          originalShutdown = listener.server.shutdown.bind(listener.server);
          Object.defineProperties(listener, {
            origin: {
              configurable: true,
              enumerable: true,
              value: 'not-an-origin',
            },
            close: {
              configurable: true,
              enumerable: true,
              value: () => {
                closeCalls++;
                return operation.promise;
              },
            },
          });
          Object.defineProperty(listener.server, 'shutdown', {
            configurable: true,
            value: () => {
              shutdownCalls++;
              return operation.promise;
            },
          });
          return listener;
        },
      })
    );

    expect(failure).to.be.instanceOf(Error);
    expect((failure as Error).message).to.eql('BootstrapStatus.start failed.');
    expect({ closeCalls, shutdownCalls, constructorReads }).to.eql({
      closeCalls: 1,
      shutdownCalls: 1,
      constructorReads: 0,
    });

    if (!listener || !originalShutdown) throw new Error('Expected retained lower listener.');
    Reflect.deleteProperty(listener.server, 'shutdown');
    await originalShutdown();
    await listener.finished;
    operation.resolve();
  });

  it('retains rollback authority until rejected shutdown terminates', async () => {
    let internalFinished: Promise<void> | undefined;
    let listenerOrigin: string | undefined;
    let closeCalls = 0;
    let shutdownCalls = 0;
    const rawFailure = Object.freeze({ kind: 'raw-shutdown-failure' });

    const failure = await catchCause(() =>
      startWith(input(), {
        ...DEFAULT_DEPENDENCIES,
        startHttp(...args) {
          const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
          internalFinished = listener.finished;
          listenerOrigin = listener.origin;
          const close = listener.close.bind(listener);
          const shutdown = listener.server.shutdown.bind(listener.server);
          Object.defineProperty(listener, 'close', {
            configurable: true,
            value: (reason?: unknown) => {
              closeCalls++;
              return close(reason);
            },
          });
          Object.defineProperty(listener.server, 'shutdown', {
            configurable: true,
            value: () => {
              shutdownCalls++;
              return shutdownCalls === 1 ? Promise.reject(rawFailure) : shutdown();
            },
          });
          Object.defineProperty(listener, 'origin', {
            configurable: true,
            value: 'not-an-origin',
          });
          return listener;
        },
      })
    );

    expect(failure).to.be.instanceOf(Error);
    expect((failure as Error).message).to.eql('BootstrapStatus.start failed.');
    expect(failure).to.not.equal(rawFailure);
    expect('cause' in (failure as object)).to.eql(false);
    expect({ closeCalls, shutdownCalls }).to.eql({ closeCalls: 1, shutdownCalls: 2 });
    if (!internalFinished || !listenerOrigin) throw new Error('Expected rollback listener.');
    await internalFinished;
    const reachabilityFailure = await catchCause(() => fetch(listenerOrigin!));
    expect(reachabilityFailure).to.be.instanceOf(Error);
  });
});
