import { describe, Dispose, expect, it, Rx, type t, Time } from './common.ts';
import { triggerUntil } from './u.fixture.ts';

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
    test(Rx.disposable());
    test(Rx.lifecycle());
  });
});

describe('Dispose.lifecycleAsync', () => {
  it('dispose → terminal state after cleanup', async () => {
    let count = 0;
    const lifecycle = Dispose.lifecycleAsync(async () => {
      await Time.wait(10);
      count++;
    });

    const events: t.DisposeAsyncEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    expect(lifecycle.disposed).to.eql(false);
    const completion = lifecycle.dispose();
    expect(lifecycle.disposed).to.eql(false);
    await completion;
    await completion;

    expect(count).to.eql(1);
    expect(lifecycle.disposed).to.eql(true);
    expect(events.length).to.eql(2);
    expect(events[1].payload.stage).to.eql('complete');
    expect(events[1].payload.is).to.eql({ ok: true, done: true });
  });

  it('cleanup failure → terminal error state', async () => {
    const lifecycle = Dispose.lifecycleAsync(async () => {
      await Time.wait(5);
      throw new Error('Boo', { cause: new Error('Sad') });
    });

    const events: t.DisposeAsyncEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    expect(lifecycle.disposed).to.eql(false);
    const completion = lifecycle.dispose();
    expect(lifecycle.disposed).to.eql(false);
    await completion;
    await completion;

    expect(events.length).to.eql(2);
    expect(events[0].payload.stage).to.eql('start');
    expect(events[1].payload.stage).to.eql('error');
    expect(events[1].payload.is).to.eql({ ok: false, done: true });
    expect(events[1].payload.error?.cause?.message).to.eql('Boo');
    expect(events[1].payload.error?.cause?.cause?.message).to.eql('Sad');
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

    await test(Dispose.disposable());
    await test(Dispose.lifecycle());
    await test([undefined, [undefined, Dispose.disposable()]]);
    await test([undefined, [undefined, Dispose.disposable().dispose$]]);
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
    const upstream = Dispose.disposable();
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

    lifecycle.dispose();

    expect(count).to.eql(1);
    expect(api.disposed).to.eql(true);
  });
});
