import { describe, Dispose, expect, it, Rx, Schedule, type t, Time } from './common.ts';
import { captureRejection, triggerUntil } from './u.fixture.ts';

describe('Dispose.lifecycle kernel behavior', () => {
  it('repeated direct disposal → one terminal event', () => {
    const disposable = Dispose.lifecycle();
    let count = 0;
    disposable.dispose$.subscribe(() => count++);

    disposable.dispose();
    disposable.dispose();

    expect(count).to.eql(1);
  });

  it('direct and protocol disposal → one operation and first reason', () => {
    const directFirst = Dispose.lifecycle();
    const directEvents: t.DisposeEvent[] = [];
    directFirst.dispose$.subscribe((event) => directEvents.push(event));

    directFirst.dispose('direct:first');
    directFirst[Symbol.dispose]();

    expect(directEvents).to.eql([{ reason: 'direct:first' }]);

    const symbolFirst = Dispose.lifecycle();
    const symbolEvents: t.DisposeEvent[] = [];
    symbolFirst.dispose$.subscribe((event) => symbolEvents.push(event));

    Reflect.apply(symbolFirst[Symbol.dispose], symbolFirst, ['protocol:ignored']);
    symbolFirst.dispose('direct:ignored');

    expect(symbolEvents).to.eql([{ reason: undefined }]);
  });

  it('using → invokes protocol disposal at scope exit', () => {
    const events: string[] = [];
    {
      using resource = Dispose.lifecycle();
      resource.dispose$.subscribe(() => events.push('dispose'));
      events.push('body');
    }

    expect(events).to.eql(['body', 'dispose']);
  });

  it('sync protocol → exclusive and coherently enumerable', () => {
    const disposable = Dispose.lifecycle();
    const direct = Object.getOwnPropertyDescriptor(disposable, 'dispose');
    const protocol = Object.getOwnPropertyDescriptor(disposable, Symbol.dispose);

    expect(protocol?.enumerable).to.eql(direct?.enumerable);
    expect(protocol?.value.length).to.eql(0);
    expect(Symbol.asyncDispose in disposable).to.eql(false);

    let events = 0;
    disposable.dispose$.subscribe(() => events++);
    const spread = { ...disposable };
    spread[Symbol.dispose]();
    spread.dispose();

    expect(events).to.eql(1);
  });

  it('synchronous until → releases the bridge after terminal disposal', async () => {
    let unsubscribed = 0;
    const until = new Rx.Observable<t.DisposeEvent>((subscriber) => {
      subscriber.next({ reason: 'synchronous:until' });
      return () => unsubscribed++;
    });

    Dispose.lifecycle(until);
    expect(unsubscribed).to.eql(0);

    await Schedule.micro();
    expect(unsubscribed).to.eql(1);
  });

  it('attachment failure → releases earlier bridges and preserves error identity', () => {
    let unsubscribed = 0;
    const first = new Rx.Observable<void>(() => () => {
      unsubscribed++;
      throw new Error('bridge:unsubscribe:failure');
    });
    const failure = new Error('bridge:subscribe:failure');
    const second = {
      subscribe() {
        throw failure;
      },
    } as unknown as t.Observable<void>;

    let caught: unknown;
    try {
      Dispose.lifecycle([first, second]);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.equal(failure);
    expect(unsubscribed).to.eql(1);
  });

  it('upstream disposal → one terminal event', () => {
    const test = (until: t.DisposeInput) => {
      const disposable = Dispose.lifecycle(until);
      let count = 0;
      disposable.dispose$.subscribe(() => count++);

      triggerUntil(until);
      expect(count).to.eql(1);

      disposable.dispose();
      triggerUntil(until);
      expect(count).to.eql(1);
    };

    test(Rx.subject<void>());
    test([Rx.subject<void>(), Rx.subject<void>()]);
    test(Rx.lifecycle());
  });
});

describe('Dispose.lifecycleAsync kernel behavior', () => {
  it('invalid overload input → clear failure', async () => {
    const asyncLifecycle = Dispose.lifecycleAsync();

    for (const input of [123, {}, asyncLifecycle]) {
      expect(() => Reflect.apply(Dispose.lifecycleAsync, undefined, [input, () => {}])).to.throw(
        TypeError,
        /UntilInput/,
      );
    }

    for (
      const args of [
        [() => {}, () => {}],
        [undefined, 123],
        [undefined, () => {}, 'extra'],
      ]
    ) {
      expect(() => Reflect.apply(Dispose.lifecycleAsync, undefined, args)).to.throw(
        TypeError,
        /overload/,
      );
    }

    await asyncLifecycle.dispose();
  });

  it('direct and protocol disposal → one stored completion and first reason', async () => {
    const cleanup = Promise.withResolvers<void>();
    const directReasons: unknown[] = [];
    const directFirst = Dispose.lifecycleAsync((event) => {
      directReasons.push(event.reason);
      return cleanup.promise;
    });

    const direct = directFirst.dispose('direct:first');
    const protocolAfterDirect = directFirst[Symbol.asyncDispose]();

    expect(protocolAfterDirect).to.equal(direct);
    expect(directReasons).to.eql(['direct:first']);

    cleanup.resolve();
    await direct;

    const symbolReasons: unknown[] = [];
    const symbolFirst = Dispose.lifecycleAsync((event) => {
      symbolReasons.push(event.reason);
    });
    const protocol = Reflect.apply(symbolFirst[Symbol.asyncDispose], symbolFirst, [
      'protocol:ignored',
    ]);
    const directAfterProtocol = symbolFirst.dispose('direct:ignored');

    expect(directAfterProtocol).to.equal(protocol);
    await protocol;
    expect(symbolReasons).to.eql([undefined]);
  });

  it('await using → awaits protocol disposal completion', async () => {
    const events: string[] = [];
    {
      await using _resource = Dispose.lifecycleAsync(async () => {
        events.push('dispose:start');
        await Schedule.micro();
        events.push('dispose:complete');
      });
      events.push('body');
    }

    expect(events).to.eql(['body', 'dispose:start', 'dispose:complete']);
  });

  it('async protocol → exclusive and coherently enumerable', async () => {
    const disposable = Dispose.lifecycleAsync();
    const direct = Object.getOwnPropertyDescriptor(disposable, 'dispose');
    const protocol = Object.getOwnPropertyDescriptor(disposable, Symbol.asyncDispose);

    expect(protocol?.enumerable).to.eql(direct?.enumerable);
    expect(protocol?.value.length).to.eql(0);
    expect(Symbol.dispose in disposable).to.eql(false);

    const spread = { ...disposable };
    const completion = spread[Symbol.asyncDispose]();
    expect(spread.dispose()).to.equal(completion);
    await completion;
  });

  it('uses captured deferred construction after ambient Promise static replacement', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(Promise, 'withResolvers');
    if (!descriptor) throw new Error('Expected Promise.withResolvers descriptor.');
    let calls = 0;
    let completion: Promise<void>;
    const disposable = Dispose.lifecycleAsync();

    try {
      Object.defineProperty(Promise, 'withResolvers', {
        ...descriptor,
        value() {
          calls += 1;
          throw new Error('ambient Promise.withResolvers invoked');
        },
      });
      completion = disposable.dispose();
    } finally {
      Object.defineProperty(Promise, 'withResolvers', descriptor);
    }

    await completion!;
    expect(calls).to.eql(0);
  });

  it('await using: body and cleanup reject → native suppression truth', async () => {
    const bodyFailure = new Error('body:failure');
    const cleanupFailure = new Error('cleanup:failure');
    let caught: unknown;

    try {
      await using _resource = Dispose.lifecycleAsync(() => Promise.reject(cleanupFailure));
      throw bodyFailure;
    } catch (error) {
      caught = error;
    }

    expect(caught).to.be.instanceOf(SuppressedError);
    const suppressed = caught as SuppressedError;
    expect(suppressed.error).to.equal(cleanupFailure);
    expect(suppressed.suppressed).to.equal(bodyFailure);
  });

  it('attachment failure → cancels a queued subscription-time cleanup request', async () => {
    let cleanup = 0;
    let unsubscribed = 0;
    const first = new Rx.Observable<t.DisposeEvent>((subscriber) => {
      subscriber.next({ reason: 'synchronous:until' });
      return () => unsubscribed++;
    });
    const failure = new Error('bridge:subscribe:failure');
    const second = {
      subscribe() {
        throw failure;
      },
    } as unknown as t.Observable<void>;

    let caught: unknown;
    try {
      Dispose.lifecycleAsync([first, second], () => void cleanup++);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.equal(failure);
    expect(unsubscribed).to.eql(1);

    await Schedule.micro();
    expect(cleanup).to.eql(0);
  });

  it('concurrent and post-settlement calls → one stored completion', async () => {
    const cleanup = Promise.withResolvers<void>();
    const reasons: unknown[] = [];
    const disposable = Dispose.lifecycleAsync((event) => {
      reasons.push(event.reason);
      return cleanup.promise;
    });
    const events: t.DisposeAsyncEvent[] = [];
    disposable.dispose$.subscribe((event) => events.push(event));

    const first = disposable.dispose(undefined);
    const concurrent = disposable.dispose('ignored:concurrent');

    expect(concurrent).to.equal(first);
    expect(reasons).to.eql([undefined]);
    expect(events.length).to.eql(1);
    expect(events[0].payload.stage).to.eql('start');
    expect(events[0].payload.reason).to.eql(undefined);

    await Schedule.micro();
    expect(events.length).to.eql(1);

    cleanup.resolve();
    await first;

    expect(disposable.dispose('ignored:settled')).to.equal(first);
    expect(events.length).to.eql(2);
    expect(events[1].payload.stage).to.eql('complete');
    expect(events[1].payload.reason).to.eql(undefined);
  });

  it('bridge-teardown re-entry → observes the stored completion', async () => {
    const cleanup = Promise.withResolvers<void>();
    const reasons: unknown[] = [];
    let reentrant: Promise<void> | undefined;
    const owner: { current?: t.DisposableAsync } = {};
    const until = new Rx.Observable<void>(() => {
      return () => {
        reentrant = owner.current?.dispose('reentrant:ignored');
      };
    });
    const disposable = Dispose.lifecycleAsync(until, (event) => {
      reasons.push(event.reason);
      return cleanup.promise;
    });
    owner.current = disposable;

    const first = disposable.dispose('first:reason');

    expect(reentrant).to.equal(first);
    expect(reasons).to.eql(['first:reason']);

    cleanup.resolve();
    await first;
  });

  it('start-event re-entry → observes the stored completion', async () => {
    const cleanup = Promise.withResolvers<void>();
    let handlerCalled = false;
    let reentrant: Promise<void> | undefined;
    const disposable = Dispose.lifecycleAsync(() => {
      handlerCalled = true;
      return cleanup.promise;
    });
    disposable.dispose$.subscribe((event) => {
      if (event.payload.stage === 'start') reentrant = disposable.dispose('reentrant:ignored');
    });

    const first = disposable.dispose('first:reason');

    expect(reentrant).to.equal(first);
    expect(handlerCalled).to.eql(true);

    cleanup.resolve();
    await first;
    expect(disposable.dispose()).to.equal(first);
  });

  it('cleanup-handler re-entry → observes the stored completion', async () => {
    const cleanup = Promise.withResolvers<void>();
    let reentrant: Promise<void> | undefined;
    const owner: { current?: t.DisposableAsync } = {};
    const disposable = Dispose.lifecycleAsync(() => {
      reentrant = owner.current?.dispose('reentrant:ignored');
      return cleanup.promise;
    });
    owner.current = disposable;

    const first = disposable.dispose('first:reason');

    expect(reentrant).to.equal(first);

    cleanup.resolve();
    await first;
  });

  it('dispose → start then complete events', async () => {
    let count = 0;
    const disposable = Dispose.lifecycleAsync(async () => {
      await Time.wait(10);
      count++;
    });

    const events: t.DisposeAsyncEvent[] = [];
    disposable.dispose$.subscribe((event) => events.push(event));

    expect(count).to.eql(0);
    const completion = disposable.dispose('test:reason');
    expect(count).to.eql(0);
    expect(events.length).to.eql(1);
    expect(events[0].payload.stage).to.eql('start');
    expect(events[0].payload.is).to.eql({ ok: true, done: false });
    expect(events[0].payload.reason).to.eql('test:reason');

    await completion;
    await completion;
    expect(count).to.eql(1);

    expect(events.length).to.eql(2);
    expect(events[1].payload.stage).to.eql('complete');
    expect(events[1].payload.is).to.eql({ ok: true, done: true });
    expect(events[1].payload.reason).to.eql('test:reason');
  });

  it('cleanup self-reference → rejects instead of remaining permanently pending', async () => {
    const owner: { current?: t.DisposableAsync } = {};
    const disposable = Dispose.lifecycleAsync(() => owner.current?.dispose('reentrant:self'));
    owner.current = disposable;
    const events: t.DisposeAsyncEvent[] = [];
    disposable.dispose$.subscribe((event) => events.push(event));

    const completion = disposable.dispose('first:reason');
    void completion.catch(() => undefined);
    await Schedule.tick();

    expect(events.length).to.eql(2);
    expect(events[1].payload.stage).to.eql('error');
    expect(await captureRejection(completion)).to.be.instanceOf(TypeError);
  });

  it('hostile Promise properties → native settlement truth', async () => {
    const thenFailure = new Error('promise:then:override');
    const fulfilled = Promise.resolve();
    Object.defineProperty(fulfilled, 'then', {
      value() {
        throw thenFailure;
      },
    });
    const success = Dispose.lifecycleAsync(() => fulfilled);

    await success.dispose();

    const rejection = new Error('promise:rejection');
    const rejected = Promise.reject(rejection);
    Object.defineProperty(rejected, 'then', {
      value() {
        throw thenFailure;
      },
    });
    const failure = Dispose.lifecycleAsync(() => rejected);

    expect(await captureRejection(failure.dispose())).to.equal(rejection);

    const constructorFailure = new Error('promise:constructor:getter');
    const hostile = Promise.resolve();
    Object.defineProperty(hostile, 'constructor', {
      get() {
        throw constructorFailure;
      },
    });
    const constructorGetter = Dispose.lifecycleAsync(() => hostile);

    expect(await captureRejection(constructorGetter.dispose())).to.equal(constructorFailure);
  });

  it('hostile thenable → one terminal settlement', async () => {
    const disposable = Dispose.lifecycleAsync(() => ({
      then(resolve: () => void, reject: (error: unknown) => void) {
        resolve();
        reject(new Error('late:rejection'));
        resolve();
      },
    }));
    const events: t.DisposeAsyncEvent[] = [];
    disposable.dispose$.subscribe((event) => events.push(event));

    const completion = disposable.dispose('first:reason');
    await completion;

    expect(disposable.dispose('ignored')).to.equal(completion);
    expect(events.map((event) => event.payload.stage)).to.eql(['start', 'complete']);
  });

  it('cleanup failures → normalized terminal error and raw rejection identity', async () => {
    const test = async (failure: unknown, cleanup: () => unknown) => {
      let count = 0;
      const disposable = Dispose.lifecycleAsync(() => {
        count++;
        return cleanup();
      });

      const events: t.DisposeAsyncEvent[] = [];
      disposable.dispose$.subscribe((event) => events.push(event));

      const reason = 'test:error-reason';
      const completion = disposable.dispose(reason);
      expect(disposable.dispose('ignored:concurrent')).to.equal(completion);
      expect(await captureRejection(completion)).to.equal(failure);

      const settled = disposable.dispose('ignored:settled');
      expect(settled).to.equal(completion);
      expect(await captureRejection(settled)).to.equal(failure);
      expect(count).to.eql(1);

      expect(events.length).to.eql(2);
      expect(events[0].payload.stage).to.eql('start');
      expect(events[0].payload.reason).to.eql(reason);
      expect(events[1].payload.stage).to.eql('error');
      expect(events[1].payload.is).to.eql({ ok: false, done: true });
      expect(events[1].payload.reason).to.eql(reason);

      const error = events[1].payload.error;
      expect(error?.name).to.eql('DisposeError');
      expect(error?.message).to.include('Failed while disposing asynchronously');
      return error;
    };

    const stringFailure = 'My String Error';
    const stringError = await test(stringFailure, () => {
      throw stringFailure;
    });
    expect(stringError?.cause?.name).to.eql('Error');
    expect(stringError?.cause?.message).to.eql(stringFailure);

    const jsFailure = new Error('My JS Error', { cause: new Error('fail') });
    const jsError = await test(jsFailure, () => Promise.reject(jsFailure));
    expect(jsError?.cause?.message).to.eql(jsFailure.message);
    expect(jsError?.cause?.cause?.message).to.eql('fail');

    const thenableFailure = new Error('Thenable getter failure');
    await test(thenableFailure, () => ({
      get then() {
        throw thenableFailure;
      },
    }));

    await test(undefined, () => Promise.reject(undefined));
  });

  it('opaque cleanup failure → raw rejection survives telemetry normalization', async () => {
    const normalizationFailure = new Error('telemetry:normalization:failure');
    const failure = new Proxy({}, {
      getPrototypeOf() {
        throw normalizationFailure;
      },
    });
    const test = async (cleanup: () => unknown) => {
      const disposable = Dispose.lifecycleAsync(cleanup);
      const events: t.DisposeAsyncEvent[] = [];
      disposable.dispose$.subscribe((event) => events.push(event));

      const completion = disposable.dispose('opaque:failure');

      expect(await captureRejection(completion)).to.equal(failure);
      expect(events.length).to.eql(2);
      expect(events[1].payload.stage).to.eql('error');
      expect(events[1].payload.error?.name).to.eql('DisposeError');
    };

    await test(() => {
      throw failure;
    });
    await test(() => Promise.reject(failure));
  });

  it('until bridge → owns rejection without changing completion truth', async () => {
    const failure = new Error('bridge:cleanup:rejected');
    const upstream = Dispose.lifecycle();
    const trap = trapUnhandledRejections();
    const disposable = Dispose.lifecycleAsync(upstream, () => Promise.reject(failure));
    const events: t.DisposeAsyncEvent[] = [];
    disposable.dispose$.subscribe((event) => events.push(event));

    try {
      upstream.dispose('bridge:reason');
      await Schedule.tick();
      await Schedule.tick();

      expect(trap.reasons).to.eql([]);
      expect(events.length).to.eql(2);
      expect(events[0].payload.stage).to.eql('start');
      expect(events[0].payload.reason).to.eql('bridge:reason');
      expect(events[1].payload.stage).to.eql('error');
      expect(events[1].payload.reason).to.eql('bridge:reason');
      expect(await captureRejection(disposable.dispose('ignored'))).to.equal(failure);
    } finally {
      trap.dispose();
    }
  });

  it('manual disposal with until input → one cleanup', async () => {
    const test = async (until: t.UntilInput) => {
      let count = 0;
      const disposable = Dispose.lifecycleAsync(until, async () => {
        await Time.wait(5);
        count++;
      });

      const events: t.DisposeAsyncEvent[] = [];
      disposable.dispose$.subscribe((event) => events.push(event));

      disposable.dispose('upstream:manual');
      disposable.dispose('ignored');

      expect(count).to.eql(0);
      await Time.wait(15);
      expect(count).to.eql(1);
      expect(events.length).to.eql(2);
      expect(events[0].payload.stage).to.eql('start');
      expect(events[0].payload.reason).to.eql('upstream:manual');
      expect(events[1].payload.stage).to.eql('complete');
      expect(events[1].payload.is).to.eql({ ok: true, done: true });
      expect(events[1].payload.reason).to.eql('upstream:manual');
    };

    await test(Dispose.lifecycle().dispose$);
    await test(Dispose.lifecycle());
    await test([undefined, [undefined, Dispose.lifecycle().dispose$]]);
    await test([undefined, [undefined, Dispose.lifecycle()]]);
  });

  it('direct reason → terminal event reason', async () => {
    const disposable = Dispose.lifecycleAsync(async () => {
      await Time.wait(1);
    });

    const events: t.DisposeAsyncEvent[] = [];
    disposable.dispose$.subscribe((event) => events.push(event));

    const reason = 'react:unmount';
    await disposable.dispose(reason);
    await disposable.dispose('ignored-second-reason');

    expect(events.length).to.eql(2);
    expect(events[0].payload.stage).to.eql('start');
    expect(events[1].payload.stage).to.eql('complete');
    expect(events[0].payload.reason).to.eql(reason);
    expect(events[1].payload.reason).to.eql(reason);
  });

  it('direct reason → cleanup handler reason', async () => {
    const received: unknown[] = [];
    const disposable = Dispose.lifecycleAsync(async (event) => {
      received.push(event.reason);
      await Time.wait(1);
    });

    const reason = 'direct:reason';
    await disposable.dispose(reason);
    await disposable.dispose('ignored');

    expect(received).to.eql([reason]);
  });

  it('until bridge reason → cleanup handler reason', async () => {
    const upstream = Dispose.lifecycle();
    const received: unknown[] = [];
    const disposable = Dispose.lifecycleAsync(upstream, async (event) => {
      received.push(event.reason);
      await Time.wait(1);
    });

    const reason = 'upstream:reason';
    upstream.dispose(reason);

    await Time.wait(5);
    await disposable.dispose('ignored');
    expect(received).to.eql([reason]);
  });
});

/**
 * Helpers:
 */
function trapUnhandledRejections() {
  const reasons: unknown[] = [];
  const onUnhandled = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    reasons.push(event.reason);
  };

  addEventListener('unhandledrejection', onUnhandled);
  return {
    reasons,
    dispose: () => removeEventListener('unhandledrejection', onUnhandled),
  };
}
