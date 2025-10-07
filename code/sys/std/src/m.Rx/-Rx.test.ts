import { type t, describe, expect, it, Testing, Time } from '../-test.ts';
import { Dispose } from '../mod.ts';
import { Rx } from './mod.ts';

describe('Observable/rx', () => {
  it('API', async () => {
    const m = await import('@sys/std/rx');
    expect(m.Rx).to.equal(Rx);

    expect(Rx.toLifecycle).to.equal(Dispose.toLifecycle);
    expect(Rx.lifecycle).to.equal(Dispose.lifecycle);
    expect(Rx.lifecycleAsync).to.equal(Dispose.lifecycleAsync);
    expect(Rx.disposable).to.equal(Dispose.disposable);
    expect(Rx.disposableAsync).to.equal(Dispose.disposableAsync);
    expect(Rx.abortable).to.equal(Dispose.abortable);
  });

  it('dual cased names', () => {
    expect(Rx).to.equal(Rx);
  });

  describe('Rx.subject (factory)', () => {
    it('void', () => {
      let fired = 0;
      const subject = Rx.subject();

      subject.subscribe(() => fired++);
      subject.next();
      expect(fired).to.eql(1);

      subject.complete();
      subject.next();
      expect(fired).to.eql(1);
    });

    it('<T>', () => {
      type T = { type: string };
      const subject = Rx.subject<T>();
      const fired: T[] = [];
      subject.subscribe((e) => fired.push(e));
      subject.next({ type: 'foo' });
      expect(fired[0]).to.eql({ type: 'foo' });
    });
  });

  describe('Rx.disposable', () => {
    it('referenced from Dispose', () => {
      expect(Rx.disposable).to.equal(Dispose.disposable);
      expect(Rx.disposableAsync).to.equal(Dispose.disposableAsync);
      expect(Rx.lifecycle).to.equal(Dispose.lifecycle);
      expect(Rx.lifecycleAsync).to.equal(Dispose.lifecycleAsync);
    });

    it('method: dispose', () => {
      const { dispose$, dispose } = Rx.disposable();

      let count = 0;
      dispose$.subscribe(() => count++);

      dispose();
      dispose();
      dispose();

      expect(count).to.eql(1); // NB: Multiple calls only fire the observable event once.
    });

    it('until$', () => {
      const until$ = Rx.subject<number>();
      const { dispose$ } = Rx.disposable(until$);

      let count = 0;
      dispose$.subscribe(() => count++);
      expect(count).to.eql(0);

      until$.next(123);
      until$.next(456);
      expect(count).to.eql(1);
    });

    it('lifecycle', () => {
      const until$ = Rx.subject<number>();
      const lifecycleA = Rx.lifecycle([undefined, [undefined, [undefined, [until$]]]]);
      const lifecycleB = Rx.lifecycle();

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

    it('Rx.done() - fires and completes the subject', () => {
      const dispose$ = Rx.subject<t.DisposeEvent>();

      let count = 0;
      dispose$.subscribe(() => (count += 1));

      Rx.done(dispose$);
      Rx.done(dispose$);
      Rx.done(dispose$);

      expect(count).to.eql(1);
    });
  });

  describe('Rx.withinTimeThreshold (eg. "double-click")', () => {
    it('fires within time-threshold', async (e) => {
      await Testing.retry(3, async () => {
        const $ = Rx.subject();
        const threshold = Rx.withinTimeThreshold($, 30);
        let fired = 0;
        threshold.$.subscribe(() => fired++);

        $.next();
        await Time.wait(5);
        $.next();
        expect(fired).to.eql(1);

        threshold.dispose();
      });
    });

    it('does not fire (outside time-threshold)', async (e) => {
      await Testing.retry(3, async () => {
        const $ = Rx.subject();
        const threshold = Rx.withinTimeThreshold($, 5);
        let fired = 0;
        threshold.$.subscribe(() => fired++);

        $.next();
        await Time.wait(10);
        $.next();
        expect(fired).to.eql(0);

        threshold.dispose();
      });
    });

    it('fires value through threshold<T>', async () => {
      await Testing.retry(3, async () => {
        type T = { foo: number };
        const $ = Rx.subject<T>();
        const threshold = Rx.withinTimeThreshold($, 10);

        const fired: T[] = [];
        threshold.$.subscribe((e) => fired.push(e));

        $.next({ foo: 1 });
        await Time.wait(5);
        $.next({ foo: 2 });

        expect(fired.length).to.eql(1);
        expect(fired[0]).to.eql({ foo: 2 }); // NB: last fired value returned.

        threshold.dispose();
      });
    });

    it('timeout$', async () => {
      await Testing.retry(3, async () => {
        const $ = Rx.subject();
        const threshold = Rx.withinTimeThreshold($, 10);

        let fired = 0;
        let timedout = 0;
        threshold.$.subscribe((e) => fired++);
        threshold.timeout$.subscribe((e) => timedout++);

        $.next();
        await Time.wait(20);
        $.next();

        expect(fired).to.eql(0);
        expect(timedout).to.eql(1);
      });
    });

    it('dispose', async () => {
      const $ = Rx.subject();
      const threshold = Rx.withinTimeThreshold($, 10);
      expect(threshold.disposed).to.eql(false);

      let fired = 0;
      threshold.$.subscribe(() => fired++);

      threshold.dispose();
      expect(threshold.disposed).to.eql(true);

      $.next();
      await Time.wait(2);
      $.next();

      await Time.wait(50);
      expect(fired).to.eql(0);
    });

    it('dispose$', (e) => {
      const $ = Rx.subject();
      const { dispose, dispose$ } = Dispose.disposable();
      const threshold = Rx.withinTimeThreshold($, 10, { dispose$ });
      expect(threshold.disposed).to.eql(false);

      expect(threshold.disposed).to.eql(false);
      dispose();
      expect(threshold.disposed).to.eql(true);
    });
  });

  describe('Rx.observeOn(Rx.animationFrameScheduler)', () => {
    it('is polyfilled on server', async () => {
      let count = 0;
      const $ = Rx.subject();
      $.pipe(Rx.observeOn(Rx.animationFrameScheduler)).subscribe(() => count++);
      $.next(); // NB: if the "requestAnimationFrame" was not polyfilled this would blow up here.
      await Time.wait(0);
      expect(count).to.eql(1);
    });
  });
});
