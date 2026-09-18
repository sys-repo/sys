import { describe, expect, it, type t } from '../../-test.ts';
import { BootstrapStatus } from '../mod.ts';
import { DEFAULT_DEPENDENCIES, startWith } from '../u/u.start.ts';
import { assertLifecycleFailure, catchCause, input } from './u.fixture.ts';

describe('BootstrapStatus.start/lifecycle', () => {
  it('native await using closes the host and awaits listener settlement', async () => {
    let started: t.BootstrapStatus.Started | undefined;

    {
      await using host = await BootstrapStatus.start(input('preparing'));
      started = host;
      expect(host.disposed).to.eql(false);
    }

    if (!started) throw new Error('Expected BootstrapStatus host.');
    expect(started.disposed).to.eql(true);
    await started.finished;
  });

  it('adapts native disposal without admitting a close reason', async () => {
    const lowerReasons: unknown[] = [];
    const started = await startWith(input('preparing'), {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
        const close = listener.close.bind(listener);
        Object.defineProperty(listener, 'close', {
          configurable: true,
          enumerable: true,
          value(reason?: unknown) {
            lowerReasons.push(reason);
            return close(reason);
          },
        });
        return listener;
      },
    });

    expect(started[Symbol.asyncDispose].length).to.eql(0);
    const disposing = Reflect.apply(
      started[Symbol.asyncDispose] as (...args: unknown[]) => Promise<void>,
      started,
      ['symbol-reason'],
    );
    const explicit = started.close('owner-reason');
    expect(disposing).to.equal(explicit);
    expect(started[Symbol.asyncDispose]()).to.equal(disposing);
    await disposing;
    await started.finished;
    expect(lowerReasons).to.eql([undefined]);
    expect(started.disposed).to.eql(true);
  });

  it('keeps disposal proof private from public finished-promise mutation', async () => {
    const started = await BootstrapStatus.start(input('preparing'));
    let constructorReads = 0;

    try {
      Object.defineProperty(started.finished, 'constructor', {
        configurable: true,
        get() {
          constructorReads++;
          throw new Error('public finished constructor invoked');
        },
      });
      await started[Symbol.asyncDispose]();
      expect({ constructorReads, disposed: started.disposed }).to.eql({
        constructorReads: 0,
        disposed: true,
      });
    } finally {
      Reflect.deleteProperty(started.finished, 'constructor');
      await started.close('test.cleanup');
      await started.finished;
    }
  });

  it('memoizes close across disposal and explicit callers', async () => {
    const started = await BootstrapStatus.start(input());
    const close1 = started[Symbol.asyncDispose]();
    const close2 = started.close('test.race-2');
    expect(close1).to.equal(close2);
    await Promise.all([close1, close2]);
    await started.finished;
    expect(started.disposed).to.eql(true);
  });

  it('sanitizes lower finished rejection only after real listener termination', async () => {
    const delayedFinished = Promise.withResolvers<void>();
    let internal: t.HttpServer.Started | undefined;
    let actualFinished: Promise<void> | undefined;
    let rawFailure: Readonly<{ server: Deno.HttpServer<Deno.NetAddr> }> | undefined;
    const started = await startWith(input(), {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
        internal = listener;
        actualFinished = listener.finished;
        rawFailure = Object.freeze({ server: listener.server });
        Object.defineProperties(listener, {
          finished: { configurable: true, value: delayedFinished.promise },
          disposed: {
            configurable: true,
            get() {
              throw rawFailure;
            },
          },
        });
        return listener;
      },
    });
    if (!internal || !actualFinished || !rawFailure) throw new Error('Expected internal listener.');

    let disposing: Promise<void> | undefined;
    try {
      expect(started.disposed).to.eql(false);
      disposing = started[Symbol.asyncDispose]();
      await actualFinished;
      const reachabilityFailure = await catchCause(() => fetch(started.url));
      expect(reachabilityFailure).to.be.instanceOf(Error);
      expect(started.disposed).to.eql(false);

      delayedFinished.reject(rawFailure);
      const disposalFailure = await catchCause(() => disposing!);
      assertLifecycleFailure(disposalFailure, rawFailure);
      const finishedFailure = await catchCause(() => started.finished);
      assertLifecycleFailure(finishedFailure, rawFailure);
      expect(started.disposed).to.eql(true);
    } finally {
      delayedFinished.reject(rawFailure);
      await internal.close('test.lifecycle-finished.cleanup');
      await actualFinished;
      if (disposing) await catchCause(() => disposing);
    }
  });

  it('sanitizes close failure, retries shutdown, and memoizes completion', async () => {
    let shutdownCalls = 0;
    let rawFailure: Readonly<{ server: Deno.HttpServer<Deno.NetAddr> }> | undefined;
    const started = await startWith(input(), {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
        const shutdown = listener.server.shutdown.bind(listener.server);
        rawFailure = Object.freeze({ server: listener.server });
        Object.defineProperty(listener.server, 'shutdown', {
          configurable: true,
          value: () => {
            shutdownCalls++;
            return shutdownCalls === 1 ? Promise.reject(rawFailure) : shutdown();
          },
        });
        Object.defineProperty(listener, 'disposed', {
          configurable: true,
          get() {
            throw rawFailure;
          },
        });
        return listener;
      },
    });
    if (!rawFailure) throw new Error('Expected raw lifecycle failure.');

    expect(started.disposed).to.eql(false);
    const close1 = started.close('test.lifecycle-close');
    const close2 = started.close('test.lifecycle-close-again');
    expect(close1).to.equal(close2);
    const failure = await catchCause(() => close1);
    assertLifecycleFailure(failure, rawFailure);
    expect(started.close('test.lifecycle-close-settled')).to.equal(close1);
    await started.finished;
    expect(started.disposed).to.eql(true);
    expect(shutdownCalls).to.eql(2);
  });

  it('reports delayed lower close rejection after listener finish', async () => {
    let rawFailure: Readonly<{ server: Deno.HttpServer<Deno.NetAddr> }> | undefined;
    const started = await startWith(input(), {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
        const finished = listener.finished;
        rawFailure = Object.freeze({ server: listener.server });
        Object.defineProperty(listener, 'close', {
          configurable: true,
          async value() {
            await listener.server.shutdown();
            await finished;
            throw rawFailure;
          },
        });
        return listener;
      },
    });
    if (!rawFailure) throw new Error('Expected delayed close failure.');

    const close1 = started.close('test.delayed-close-failure');
    const close2 = started.close('test.delayed-close-failure-again');
    expect(close1).to.equal(close2);
    const failure = await catchCause(() => close1);
    assertLifecycleFailure(failure, rawFailure);
    expect(started.close('test.delayed-close-failure-settled')).to.equal(close1);
    await started.finished;
    expect(started.disposed).to.eql(true);
  });
});
