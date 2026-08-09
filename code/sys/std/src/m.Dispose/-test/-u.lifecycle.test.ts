import { describe, Dispose, expect, it, Rx, Schedule, type t, Time } from './common.ts';
import { captureRejection, triggerUntil, waitForAsyncDispose } from './u.fixture.ts';

describe('Dispose.lifecycle', () => {
  it('repeated direct disposal → one terminal event and disposed state', () => {
    const lifecycle = Dispose.lifecycle();
    expect(lifecycle.disposed).to.eql(false);

    let count = 0;
    lifecycle.dispose$.subscribe(() => count++);

    lifecycle.dispose();
    lifecycle.dispose();

    expect(count).to.eql(1);
    expect(lifecycle.disposed).to.eql(true);
  });

  it('using → retains the owned native authority and terminal state', () => {
    let lifecycle: ReturnType<typeof Dispose.lifecycle> | undefined;
    {
      using resource = Dispose.lifecycle();
      lifecycle = resource;
      expect(resource.disposed).to.eql(false);
    }

    expect(lifecycle?.disposed).to.eql(true);
    expect(Symbol.asyncDispose in lifecycle!).to.eql(false);
  });

  it('synchronous until → terminal state after construction', async () => {
    const lifecycle = Dispose.lifecycle(Rx.of({ reason: 'synchronous:until' }));
    const events: t.DisposeEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    expect(lifecycle.disposed).to.eql(false);
    await Schedule.micro();

    expect(lifecycle.disposed).to.eql(true);
    expect(events).to.eql([{ reason: 'synchronous:until' }]);
  });

  it('direct disposal before queued synchronous until → direct reason wins', async () => {
    const lifecycle = Dispose.lifecycle(Rx.of({ reason: 'synchronous:until' }));
    const events: t.DisposeEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    lifecycle.dispose('direct:reason');
    await Schedule.micro();

    expect(events).to.eql([{ reason: 'direct:reason' }]);
  });

  it('cross-bridge emission during attachment → terminal state after construction', async () => {
    const first = Rx.subject<t.DisposeEvent>();
    const second = new Rx.Observable<void>(() => {
      first.next({ reason: 'cross-bridge:until' });
    });
    const lifecycle = Dispose.lifecycle([first, second]);
    const events: t.DisposeEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    expect(lifecycle.disposed).to.eql(false);
    await Schedule.micro();

    expect(lifecycle.disposed).to.eql(true);
    expect(events).to.eql([{ reason: 'cross-bridge:until' }]);
  });

  it('upstream disposal → one terminal event and disposed state', () => {
    const test = (until: t.DisposeInput) => {
      const lifecycle = Dispose.lifecycle(until);
      expect(lifecycle.disposed).to.eql(false);

      let count = 0;
      lifecycle.dispose$.subscribe(() => count++);

      triggerUntil(until);
      expect(count).to.eql(1);
      expect(lifecycle.disposed).to.eql(true);

      lifecycle.dispose();
      triggerUntil(until);
      expect(count).to.eql(1);
      expect(lifecycle.disposed).to.eql(true);
    };

    test(Rx.subject<void>());
    test([Rx.subject<void>(), Rx.subject<void>()]);
    test(Rx.lifecycle());
  });
});

describe('Dispose.lifecycleAsync', () => {
  it('native disposal → returns the owned completion and terminal state', async () => {
    const cleanup = Promise.withResolvers<void>();
    const lifecycle = Dispose.lifecycleAsync(() => cleanup.promise);

    const native = lifecycle[Symbol.asyncDispose]();
    const direct = lifecycle.dispose('direct:ignored');

    expect(direct).to.equal(native);
    expect(lifecycle.disposed).to.eql(false);
    expect(Symbol.dispose in lifecycle).to.eql(false);

    cleanup.resolve();
    await native;
    expect(lifecycle.disposed).to.eql(true);
  });

  it('synchronous until → cleanup starts after construction and releases its bridge', async () => {
    const cleanup = Promise.withResolvers<void>();
    let constructed = false;
    let observedBeforeConstruction = false;
    let reason: unknown;
    let unsubscribed = 0;
    const until = new Rx.Observable<t.DisposeEvent>((subscriber) => {
      subscriber.next({ reason: 'synchronous:until' });
      return () => unsubscribed++;
    });
    const lifecycle = Dispose.lifecycleAsync(until, (event) => {
      observedBeforeConstruction = !constructed;
      reason = event.reason;
      return cleanup.promise;
    });
    constructed = true;

    expect(unsubscribed).to.eql(0);
    await Schedule.micro();

    expect(observedBeforeConstruction).to.eql(false);
    expect(reason).to.eql('synchronous:until');
    expect(unsubscribed).to.eql(1);
    expect(lifecycle.disposed).to.eql(false);

    cleanup.resolve();
    await waitForAsyncDispose(lifecycle);
    expect(lifecycle.disposed).to.eql(true);
  });

  it('direct disposal before queued synchronous until → direct reason wins while running', async () => {
    const cleanup = Promise.withResolvers<void>();
    const reasons: unknown[] = [];
    const lifecycle = Dispose.lifecycleAsync(
      Rx.of({ reason: 'synchronous:until' }),
      (event) => {
        reasons.push(event.reason);
        return cleanup.promise;
      },
    );

    const completion = lifecycle.dispose('direct:reason');
    await Schedule.micro();

    expect(reasons).to.eql(['direct:reason']);
    expect(lifecycle.disposed).to.eql(false);

    cleanup.resolve();
    await completion;
    expect(lifecycle.disposed).to.eql(true);
  });

  it('dispose → terminal state after cleanup', async () => {
    let count = 0;
    const lifecycle = Dispose.lifecycleAsync(async () => {
      await Time.wait(10);
      count++;
    });

    const events: t.DisposeAsyncEvent[] = [];
    let disposedAtTerminal: boolean | undefined;
    lifecycle.dispose$.subscribe((event) => {
      events.push(event);
      if (event.payload.is.done) disposedAtTerminal = lifecycle.disposed;
    });

    expect(lifecycle.disposed).to.eql(false);
    const completion = lifecycle.dispose();
    expect(lifecycle.disposed).to.eql(false);
    await completion;
    await completion;

    expect(count).to.eql(1);
    expect(disposedAtTerminal).to.eql(true);
    expect(lifecycle.disposed).to.eql(true);
    expect(events.length).to.eql(2);
    expect(events[1].payload.stage).to.eql('complete');
    expect(events[1].payload.is).to.eql({ ok: true, done: true });
  });

  it('synchronous cleanup failure → terminal state before dispose returns', async () => {
    const failure = new Error('synchronous:cleanup:failure');
    const lifecycle = Dispose.lifecycleAsync(() => {
      throw failure;
    });
    const events: t.DisposeAsyncEvent[] = [];
    let disposedAtTerminal: boolean | undefined;
    lifecycle.dispose$.subscribe((event) => {
      events.push(event);
      if (event.payload.is.done) disposedAtTerminal = lifecycle.disposed;
    });

    const completion = lifecycle.dispose('first:reason');
    const rejection = captureRejection(completion);

    expect(events.map((event) => event.payload.stage)).to.eql(['start', 'error']);
    expect(disposedAtTerminal).to.eql(true);
    expect(lifecycle.disposed).to.eql(true);
    expect(await rejection).to.equal(failure);
  });

  it('asynchronous cleanup failure → terminal error state and rejected completion', async () => {
    const failure = new Error('Boo', { cause: new Error('Sad') });
    const lifecycle = Dispose.lifecycleAsync(async () => {
      await Time.wait(5);
      throw failure;
    });

    const events: t.DisposeAsyncEvent[] = [];
    let disposedAtTerminal: boolean | undefined;
    lifecycle.dispose$.subscribe((event) => {
      events.push(event);
      if (event.payload.is.done) disposedAtTerminal = lifecycle.disposed;
    });

    expect(lifecycle.disposed).to.eql(false);
    const completion = lifecycle.dispose();
    expect(lifecycle.disposed).to.eql(false);
    expect(await captureRejection(completion)).to.equal(failure);
    expect(await captureRejection(lifecycle.dispose())).to.equal(failure);

    expect(events.length).to.eql(2);
    expect(events[0].payload.stage).to.eql('start');
    expect(events[1].payload.stage).to.eql('error');
    expect(events[1].payload.is).to.eql({ ok: false, done: true });
    expect(events[1].payload.error?.cause?.message).to.eql('Boo');
    expect(events[1].payload.error?.cause?.cause?.message).to.eql('Sad');
    expect(disposedAtTerminal).to.eql(true);
    expect(lifecycle.disposed).to.eql(true);
  });

  it('manual disposal with until input → one cleanup and terminal state', async () => {
    const test = async (until: t.UntilInput) => {
      let count = 0;
      const lifecycle = Dispose.lifecycleAsync(until, async () => {
        await Time.wait(5);
        count++;
      });

      const events: t.DisposeAsyncEvent[] = [];
      lifecycle.dispose$.subscribe((event) => events.push(event));

      lifecycle.dispose();
      lifecycle.dispose();

      expect(count).to.eql(0);
      await Time.wait(15);
      expect(count).to.eql(1);
      expect(events.length).to.eql(2);
      expect(events[0].payload.stage).to.eql('start');
      expect(events[1].payload.stage).to.eql('complete');
      expect(events[1].payload.is).to.eql({ ok: true, done: true });
      expect(lifecycle.disposed).to.eql(true);
    };

    await test(Dispose.disposable().dispose$);
    await test(Dispose.lifecycle());
    await test([undefined, [undefined, Dispose.disposable().dispose$]]);
    await test([undefined, [undefined, Dispose.lifecycle()]]);
  });

  it('direct reason → terminal event reason', async () => {
    const lifecycle = Dispose.lifecycleAsync(async () => {
      await Time.wait(1);
    });

    const events: t.DisposeAsyncEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    const reason = 'direct:reason';
    await lifecycle.dispose(reason);
    await lifecycle.dispose('ignored');

    expect(lifecycle.disposed).to.eql(true);
    expect(events.length).to.eql(2);
    expect(events[0].payload.stage).to.eql('start');
    expect(events[0].payload.reason).to.eql(reason);
    expect(events[1].payload.stage).to.eql('complete');
    expect(events[1].payload.is).to.eql({ ok: true, done: true });
    expect(events[1].payload.reason).to.eql(reason);
  });

  it('until bridge reason → terminal event reason', async () => {
    const upstream = Dispose.lifecycle();
    const lifecycle = Dispose.lifecycleAsync(upstream, async () => void (await Time.wait(1)));

    const events: t.DisposeAsyncEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    const reason = 'upstream:reason';
    upstream.dispose(reason);
    await Time.wait(5);

    expect(lifecycle.disposed).to.eql(true);
    expect(events.length).to.eql(2);
    expect(events[0].payload.stage).to.eql('start');
    expect(events[0].payload.reason).to.eql(reason);
    expect(events[1].payload.stage).to.eql('complete');
    expect(events[1].payload.is).to.eql({ ok: true, done: true });
    expect(events[1].payload.reason).to.eql(reason);
  });
});

describe('Dispose.toLifecycle', () => {
  type T = t.Lifecycle & { count: number };

  it('existing lifecycle → shared authority and state', () => {
    const lifecycle = Rx.lifecycle();
    const api = Dispose.toLifecycle<T>(lifecycle, { count: 123 });
    let count = 0;
    api.dispose$.subscribe(() => count++);

    expect(api.count).to.eql(123);
    expect(api.disposed).to.eql(false);

    lifecycle.dispose();
    api.dispose();

    expect(count).to.eql(1);
    expect(api.disposed).to.eql(true);
  });

  it('plain object → new lifecycle authority', () => {
    const api = Dispose.toLifecycle<T>({ count: 123 });
    let count = 0;
    api.dispose$.subscribe(() => count++);

    expect(api.count).to.eql(123);
    expect(api.disposed).to.eql(false);

    api.dispose();

    expect(count).to.eql(1);
    expect(api.disposed).to.eql(true);
  });

  it('configurable native authority → replaced with the supplied owner', () => {
    const lifecycle = Dispose.lifecycle();
    const target = { count: 123 };
    let staleCalls = 0;
    Object.defineProperty(target, Symbol.dispose, {
      configurable: true,
      value: () => staleCalls++,
    });

    const events: t.DisposeEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    const api = Dispose.toLifecycle<T>(lifecycle, target);
    Reflect.apply(api[Symbol.dispose], api, ['native:ignored']);

    expect(staleCalls).to.eql(0);
    expect(events).to.eql([{ reason: undefined }]);
    expect(lifecycle.disposed).to.eql(true);
    expect(api.disposed).to.eql(true);
    const descriptor = Object.getOwnPropertyDescriptor(api, Symbol.dispose);
    expect(descriptor?.enumerable).to.eql(true);
    expect(descriptor?.value.length).to.eql(0);
  });
});

describe('Dispose.toLifecycleView', () => {
  type T = t.LifecycleView & { count: number };

  it('lifecycle → state and events without disposal authority', () => {
    const lifecycle = Dispose.lifecycle();
    const api = Dispose.toLifecycleView<T>(lifecycle, { count: 123 });
    let count = 0;
    api.dispose$.subscribe(() => count++);

    expect(api.count).to.eql(123);
    expect(api.disposed).to.eql(false);
    expect('dispose' in api).to.eql(false);
    expect(Symbol.dispose in api).to.eql(false);
    expect(Symbol.asyncDispose in api).to.eql(false);

    lifecycle.dispose();

    expect(count).to.eql(1);
    expect(api.disposed).to.eql(true);
  });
});
