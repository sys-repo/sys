import { describe, expect, it, Rx, type t, Time } from '../../../-test.ts';
import { RxBus } from '../mod.ts';
import { connect } from '../u.bus.connect.ts';

describe('BusConnect', () => {
  type E = { type: 'foo'; payload: { count?: number } };

  it('throw: not enough buses', () => {
    const test = (input: t.EventBus[]) => {
      const fn = () => connect(input);
      expect(fn).to.throw(/Must have at least two event-buses to setup connection/);
    };
    test([]);
    test([RxBus()]);
  });

  it('connect: (3) buses ', async () => {
    const a = RxBus<E>();
    const b = RxBus<E>();
    const c = RxBus<E>();
    connect<E>([a, b, c]);

    const firedA: E[] = [];
    const firedB: E[] = [];
    const firedC: E[] = [];
    a.$.subscribe((e) => firedA.push(e));
    b.$.subscribe((e) => firedB.push(e));
    c.$.subscribe((e) => firedC.push(e));

    const event: E = { type: 'foo', payload: { count: 123 } };
    a.fire(event);

    expect(firedA).to.eql([event]);
    expect(firedB).to.eql([]);
    expect(firedC).to.eql([]);

    await Time.wait(10);
    expect(firedA).to.eql([event]);
    expect(firedB).to.eql([event]);
    expect(firedC).to.eql([event]);
  });

  it('async: true - default', async () => {
    const a = RxBus<E>();
    const b = RxBus<E>();
    connect<E>([a, b]);

    const firedA: E[] = [];
    const firedB: E[] = [];
    a.$.subscribe((e) => firedA.push(e));
    b.$.subscribe((e) => firedB.push(e));

    const event: E = { type: 'foo', payload: { count: 123 } };
    a.fire(event);

    expect(firedA).to.eql([event]);
    expect(firedB).to.eql([]); // NB: Empty (because asynchronous)

    await Time.wait(10);
    expect(firedA).to.eql([event]);
    expect(firedB).to.eql([event]);
  });

  it('async: false (aka. synchronous)', () => {
    const a = RxBus<E>();
    const b = RxBus<E>();
    connect<E>([a, b], { async: false });

    const firedA: E[] = [];
    const firedB: E[] = [];
    a.$.subscribe((e) => firedA.push(e));
    b.$.subscribe((e) => firedB.push(e));

    const event: E = { type: 'foo', payload: { count: 123 } };
    a.fire(event);

    expect(firedA).to.eql([event]);
    expect(firedB).to.eql([event]); // NB: Has immediate value (because synchronous).
  });

  it('dispose through native using', () => {
    const conn = connect<E>([RxBus<E>(), RxBus<E>()]);
    let disposed = 0;
    conn.dispose$.subscribe(() => disposed++);

    {
      using _conn = conn;
      expect(conn.isDisposed).to.eql(false);
    }

    conn.dispose();
    expect(conn.isDisposed).to.eql(true);
    expect(disposed).to.eql(1);
  });

  it('dispose: via { until } param', async () => {
    const { dispose, dispose$ } = Rx.disposable();
    const a = RxBus<E>();
    const b = RxBus<E>();
    connect<E>([a, b], { until: dispose$ });

    const firedA: E[] = [];
    const firedB: E[] = [];
    a.$.subscribe((e) => firedA.push(e));
    b.$.subscribe((e) => firedB.push(e));

    dispose();
    const event: E = { type: 'foo', payload: { count: 123 } };
    a.fire(event);
    a.fire(event);

    await Time.wait(10);
    expect(firedA).to.eql([event, event]);
    expect(firedB).to.eql([]);
  });

  it('dispose: via .dispose() method', async () => {
    const a = RxBus<E>();
    const b = RxBus<E>();
    const conn = connect<E>([a, b]);

    const firedA: E[] = [];
    const firedB: E[] = [];
    a.$.subscribe((e) => firedA.push(e));
    b.$.subscribe((e) => firedB.push(e));

    conn.dispose();
    const event: E = { type: 'foo', payload: { count: 123 } };
    a.fire(event);
    a.fire(event);

    await Time.wait(10);
    expect(firedA).to.eql([event, event]);
    expect(firedB).to.eql([]);
  });
});
