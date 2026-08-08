import { describe, Dispose, expect, it, Rx, Schedule, type t, Time } from './common.ts';
import { triggerUntil } from './u.fixture.ts';

describe('Dispose.disposable', () => {
  it('repeated direct disposal → one terminal event', () => {
    const disposable = Dispose.disposable();
    let count = 0;
    disposable.dispose$.subscribe(() => count++);

    disposable.dispose();
    disposable.dispose();

    expect(count).to.eql(1);
  });

  it('synchronous until → releases the bridge after terminal disposal', async () => {
    let unsubscribed = 0;
    const until = new Rx.Observable<t.DisposeEvent>((subscriber) => {
      subscriber.next({ reason: 'synchronous:until' });
      return () => unsubscribed++;
    });

    Dispose.disposable(until);
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
      Dispose.disposable([first, second]);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.equal(failure);
    expect(unsubscribed).to.eql(1);
  });

  it('upstream disposal → one terminal event', () => {
    const test = (until: t.DisposeInput) => {
      const disposable = Dispose.disposable(until);
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
    test(Rx.disposable());
    test(Rx.lifecycle());
  });
});

describe('Dispose.disposableAsync', () => {
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
      Dispose.disposableAsync([first, second], () => void cleanup++);
    } catch (error) {
      caught = error;
    }

    expect(caught).to.equal(failure);
    expect(unsubscribed).to.eql(1);

    await Schedule.micro();
    expect(cleanup).to.eql(0);
  });

  it('dispose → start then complete events', async () => {
    let count = 0;
    const disposable = Dispose.disposableAsync(async () => {
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

  it('cleanup failure → normalized terminal error', async () => {
    const test = async (generateError: () => unknown) => {
      let count = 0;
      const disposable = Dispose.disposableAsync(async () => {
        await Time.wait(5);
        count++;
        throw generateError();
      });

      const events: t.DisposeAsyncEvent[] = [];
      disposable.dispose$.subscribe((event) => events.push(event));

      const reason = 'test:error-reason';
      const completion = disposable.dispose(reason);
      await completion;
      await completion;
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

    const stringError = await test(() => 'My String Error');
    expect(stringError?.cause?.name).to.eql('Error');
    expect(stringError?.cause?.message).to.eql('My String Error');

    const jsError = await test(() => new Error('My JS Error', { cause: new Error('fail') }));
    expect(jsError?.cause?.message).to.eql('My JS Error');
    expect(jsError?.cause?.cause?.message).to.eql('fail');
  });

  it('manual disposal with until input → one cleanup', async () => {
    const test = async (until: t.UntilInput) => {
      let count = 0;
      const disposable = Dispose.disposableAsync(until, async () => {
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

    await test(Dispose.disposable());
    await test(Dispose.lifecycle());
    await test([undefined, [undefined, Dispose.disposable()]]);
    await test([undefined, [undefined, Dispose.disposable().dispose$]]);
  });

  it('direct reason → terminal event reason', async () => {
    const disposable = Dispose.disposableAsync(async () => {
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
    const disposable = Dispose.disposableAsync(async (event) => {
      received.push(event.reason);
      await Time.wait(1);
    });

    const reason = 'direct:reason';
    await disposable.dispose(reason);
    await disposable.dispose('ignored');

    expect(received).to.eql([reason]);
  });

  it('until bridge reason → cleanup handler reason', async () => {
    const upstream = Dispose.disposable();
    const received: unknown[] = [];
    const disposable = Dispose.disposableAsync(upstream, async (event) => {
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
