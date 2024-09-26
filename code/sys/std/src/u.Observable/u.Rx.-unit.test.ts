import { describe, expect, it } from '../-test.ts';
import { rx, Rx } from './mod.ts';

describe('Observable/rx', () => {
  it('dual cased names', () => {
    expect(Rx).to.equal(rx);
  });

  describe('rx.subject (factory)', () => {
    it('void', () => {
      let fired = 0;
      const subject = rx.subject();

      subject.subscribe(() => fired++);
      subject.next();
      expect(fired).to.eql(1);

      subject.complete();
      subject.next();
      expect(fired).to.eql(1);
    });

    it('<T>', () => {
      type T = { type: string };
      const subject = rx.subject<T>();
      const fired: T[] = [];
      subject.subscribe((e) => fired.push(e));
      subject.next({ type: 'foo' });
      expect(fired[0]).to.eql({ type: 'foo' });
    });
  });

  describe('rx.event | rx.payload', () => {
    type FooEvent = { type: 'TYPE/foo'; payload: Foo };
    type Foo = { count: number };

    type BarEvent = { type: 'TYPE/bar'; payload: Bar };
    type Bar = { msg: string };

    it('rx.event', () => {
      const source$ = rx.subject<FooEvent | BarEvent>();

      const fired: FooEvent[] = [];
      rx.event<FooEvent>(source$, 'TYPE/foo').subscribe((e) => fired.push(e));

      source$.next({ type: 'TYPE/bar', payload: { msg: 'hello' } });
      source$.next({ type: 'TYPE/foo', payload: { count: 123 } });
      source$.next({ type: 'TYPE/bar', payload: { msg: 'hello' } });

      expect(fired.length).to.eql(1);
      expect(fired[0].type).to.eql('TYPE/foo');
      expect(fired[0].payload).to.eql({ count: 123 });
    });

    it('rx.payload', () => {
      const source$ = rx.subject<FooEvent | BarEvent>();

      const fired: Foo[] = [];
      rx.payload<FooEvent>(source$, 'TYPE/foo').subscribe((e) => fired.push(e));

      source$.next({ type: 'TYPE/bar', payload: { msg: 'hello' } });
      source$.next({ type: 'TYPE/foo', payload: { count: 123 } });
      source$.next({ type: 'TYPE/bar', payload: { msg: 'hello' } });

      expect(fired.length).to.eql(1);
      expect(fired[0]).to.eql({ count: 123 });
    });
  });

  describe('rx.disposable', () => {
    it('method: dispose', () => {
      const { dispose$, dispose } = rx.disposable();

      let count = 0;
      dispose$.subscribe(() => count++);

      dispose();
      dispose();
      dispose();

      expect(count).to.eql(1); // NB: Multiple calls only fire the observable event once.
    });

    it('until$', () => {
      const until$ = rx.subject<number>();
      const { dispose$ } = rx.disposable(until$);

      let count = 0;
      dispose$.subscribe(() => count++);
      expect(count).to.eql(0);

      until$.next(123);
      until$.next(456);
      expect(count).to.eql(1);
    });

    it('lifecycle', () => {
      const until$ = rx.subject<number>();
      const lifecycleA = rx.lifecycle([undefined, [undefined, [undefined, [until$]]]]);
      const lifecycleB = rx.lifecycle();

      const count = { a: 0, b: 0 };
      lifecycleA.dispose$.subscribe(() => count.a++);
      lifecycleB.dispose$.subscribe(() => count.b++);

      expect(lifecycleA.disposed).to.eql(false);
      expect(lifecycleB.disposed).to.eql(false);

      until$.next(123);
      expect(lifecycleA.disposed).to.eql(true);
      expect(lifecycleB.disposed).to.eql(false);
      expect(count).to.eql({ a: 1, b: 0 });

      lifecycleA.dispose(); // NB: No effect.
      lifecycleB.dispose();

      expect(lifecycleA.disposed).to.eql(true);
      expect(lifecycleB.disposed).to.eql(true);
      expect(count).to.eql({ a: 1, b: 1 });
    });

    it('rx.done() - fires and completes the subject', () => {
      const dispose$ = rx.subject<void>();

      let count = 0;
      dispose$.subscribe(() => count++);

      rx.done(dispose$);
      rx.done(dispose$);
      rx.done(dispose$);

      expect(count).to.eql(1);
    });
  });

  describe('rx.asPromise', () => {
    type E = { type: 'foo'; payload: { count: number } };

    describe('first', () => {
      it('resolves first response', async () => {
        const $ = new rx.Subject<E>();
        const promise = rx.asPromise.first<E>(rx.payload<E>($, 'foo'));

        $.next({ type: 'foo', payload: { count: 1 } });
        $.next({ type: 'foo', payload: { count: 2 } });
        $.next({ type: 'foo', payload: { count: 3 } });

        const res = await promise;
        expect(res.payload).to.eql({ count: 1 });
        expect(res.error).to.eql(undefined);
      });

      it('error: completed observable', async () => {
        const $ = new rx.Subject<E>();
        $.complete();

        const res = await rx.asPromise.first<E>(rx.payload<E>($, 'foo'));

        expect(res.payload).to.eql(undefined);
        expect(res.error?.code).to.eql('completed');
        expect(res.error?.message).to.include('The given observable has already "completed"');
      });

      it('error: timeout', async () => {
        const $ = new rx.Subject<E>();
        const res = await rx.asPromise.first<E>(rx.payload<E>($, 'foo'), { timeout: 10 });
        expect(res.payload).to.eql(undefined);
        expect(res.error?.code).to.eql('timeout');
        expect(res.error?.message).to.include('Timed out after 10 msecs');
      });

      it('error: timeout ("op")', async () => {
        const op = 'foobar';
        const $ = new rx.Subject<E>();
        const res = await rx.asPromise.first<E>(rx.payload<E>($, 'foo'), { op, timeout: 10 });
        expect(res.payload).to.eql(undefined);
        expect(res.error?.code).to.eql('timeout');
        expect(res.error?.message).to.include('Timed out after 10 msecs');
        expect(res.error?.message).to.include(`[${op}]`);
      });
    });
  });
});
