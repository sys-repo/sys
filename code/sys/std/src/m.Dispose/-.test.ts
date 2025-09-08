import { Subject } from 'rxjs';
import { describe, expect, it, type t } from '../-test.ts';
import { Time } from '../m.DateTime/mod.ts';
import { Is, rx } from '../mod.ts';
import { Dispose } from './mod.ts';

describe('Disposable', () => {
  describe('sync', () => {
    it('disposable: create → dispose', () => {
      const test = (until?: t.DisposeInput) => {
        const obj = Dispose.disposable(until);

        let count = 0;
        obj.dispose$.subscribe(() => count++);

        obj.dispose();
        obj.dispose();

        if (Is.disposable(until)) {
          until?.dispose();
        } else {
          until?.forEach((m) => (Is.disposable(m) ? m.dispose() : m.next()));
        }

        expect(count).to.eql(1);
      };

      test();
      test(new Subject<void>());
      test([new Subject<void>(), new Subject<void>()]);
      test(rx.disposable());
      test(rx.lifecycle());
    });

    it('lifecycle: create → dispose', () => {
      const test = (until?: t.DisposeInput) => {
        const obj = Dispose.lifecycle(until);
        expect(obj.disposed).to.eql(false);

        let count = 0;
        obj.dispose$.subscribe(() => count++);

        obj.dispose();
        obj.dispose();

        if (Is.disposable(until)) {
          until?.dispose();
        } else {
          until?.forEach((subject) => subject.next());
        }

        expect(count).to.eql(1); // NB: multiple calls to dispose to not refire the cleanup handler.
      };

      test();
      test(new Subject<void>());
      test([new Subject<void>(), new Subject<void>()]);

      test(rx.disposable());
      test(rx.lifecycle());
    });
  });

  describe('Dispose.disposableAsync', () => {
    it('create → dispose | (events)', async () => {
      let count = 0;
      const obj = Dispose.disposableAsync(async () => {
        await Time.wait(10);
        count++;
      });

      const fired: t.DisposeAsyncEvent[] = [];
      obj.dispose$.subscribe((e) => fired.push(e));

      expect(count).to.eql(0);
      const promise = obj.dispose('test:reason');
      expect(count).to.eql(0); // not yet completed
      expect(fired.length).to.eql(1);
      expect(fired[0].payload.stage).to.eql('start');
      expect(fired[0].payload.is).to.eql({ ok: true, done: false });
      expect(fired[0].payload.reason).to.eql('test:reason');

      await promise;
      await promise; // idempotent
      expect(count).to.eql(1);

      expect(fired.length).to.eql(2);
      expect(fired[1].payload.stage).to.eql('complete');
      expect(fired[1].payload.is).to.eql({ ok: true, done: true });
      expect(fired[1].payload.reason).to.eql('test:reason');
    });

    it('error in cleanup handler', async () => {
      const test = async (generateError: () => unknown) => {
        let count = 0;
        const obj = Dispose.disposableAsync(async () => {
          await Time.wait(5);
          count++;
          throw generateError();
        });

        const fired: t.DisposeAsyncEvent[] = [];
        obj.dispose$.subscribe((e) => fired.push(e));

        const reason = 'test:error-reason';
        const promise = obj.dispose(reason);
        await promise;
        await promise; // idempotent
        expect(count).to.eql(1);

        expect(fired.length).to.eql(2);
        expect(fired[0].payload.stage).to.eql('start');
        expect(fired[0].payload.reason).to.eql(reason);

        expect(fired[1].payload.stage).to.eql('error');
        expect(fired[1].payload.is).to.eql({ ok: false, done: true });
        expect(fired[1].payload.reason).to.eql(reason);

        const err = fired[1].payload.error;
        expect(err?.name).to.eql('DisposeError');
        expect(err?.message).to.include('Failed while disposing asynchronously');
        return err;
      };

      const err1 = await test(() => 'My String Error');
      expect(err1?.cause?.name).to.eql('Error');
      expect(err1?.cause?.message).to.eql('My String Error');

      const err2 = await test(() => new Error('My JS Error', { cause: new Error('fail') }));
      expect(err2?.cause?.message).to.eql('My JS Error');
      expect(err2?.cause?.cause?.message).to.eql('fail');
    });

    it('until$ (parameter)', async () => {
      const test = async (until: t.UntilInput) => {
        let count = 0;
        const obj = Dispose.disposableAsync(until, async () => {
          await Time.wait(5);
          count++;
        });

        const fired: t.DisposeAsyncEvent[] = [];
        obj.dispose$.subscribe((e) => fired.push(e));

        obj.dispose('upstream:manual');
        obj.dispose('ignored'); // idempotent

        expect(count).to.eql(0);
        await Time.wait(15);
        expect(count).to.eql(1);

        expect(fired.length).to.eql(2);
        expect(fired[0].payload.stage).to.eql('start');
        expect(fired[0].payload.reason).to.eql('upstream:manual');

        expect(fired[1].payload.stage).to.eql('complete');
        expect(fired[1].payload.is).to.eql({ ok: true, done: true });
        expect(fired[1].payload.reason).to.eql('upstream:manual');
      };

      await test(Dispose.disposable());
      await test(Dispose.lifecycle());
      await test([undefined, [undefined, Dispose.disposable()]]);
      await test([undefined, [undefined, Dispose.disposable().dispose$]]);
    });

    it('passes reason through dispose$ events', async () => {
      const obj = Dispose.disposableAsync(async () => {
        await Time.wait(1);
      });

      const fired: t.DisposeAsyncEvent[] = [];
      obj.dispose$.subscribe((e) => fired.push(e));

      const reason = 'react:unmount';
      await obj.dispose(reason);
      await obj.dispose('ignored-second-reason');

      expect(fired.length).to.eql(2);
      expect(fired[0].payload.stage).to.eql('start');
      expect(fired[1].payload.stage).to.eql('complete');

      expect(fired[0].payload.reason).to.eql(reason);
      expect(fired[1].payload.reason).to.eql(reason);
    });

    it('passes reason to onDispose (direct)', async () => {
      const received: unknown[] = [];
      const obj = Dispose.disposableAsync(async (e) => {
        console.log('e', e);
        received.push(e.reason);
        await Time.wait(1);
      });

      const reason = 'direct:reason';
      await obj.dispose(reason);
      await obj.dispose('ignored'); // ← idempotent

      expect(received).to.eql([reason]); // ← handler runs once with reason
    });

    it('passes reason to onDispose (via until bridge)', async () => {
      const upstream = Dispose.disposable();
      const received: unknown[] = [];

      const obj = Dispose.disposableAsync(upstream, async (e) => {
        received.push(e.reason);
        await Time.wait(1);
      });

      const reason = 'upstream:reason';
      upstream.dispose(reason); // ← triggers `obj.dispose(reason)` via bridge.

      await Time.wait(5);
      await obj.dispose('ignored'); // ← idempotent.
      expect(received).to.eql([reason]);
    });
  });

  describe('Dispose.lifecycleAsync', () => {
    it('create → dispose → disposed | (events)', async () => {
      let count = 0;
      const obj = Dispose.lifecycleAsync(async () => {
        await Time.wait(10);
        count++;
      });

      const fired: t.DisposeAsyncEvent[] = [];
      obj.dispose$.subscribe((e) => fired.push(e));

      expect(obj.disposed).to.eql(false);
      const promise = obj.dispose();
      expect(obj.disposed).to.eql(false); // Not yet disposed (async op).
      await promise;
      await promise; // NB: second call.
      expect(count).to.eql(1); // NB: multiple calls to dispose to not re-fire the cleanup handler.
      expect(obj.disposed).to.eql(true);

      expect(fired.length).to.eql(2);
      expect(fired[1].payload.stage).to.eql('complete');
      expect(fired[1].payload.is).to.eql({ ok: true, done: true });
    });

    it('error in cleanup handler', async () => {
      const obj = Dispose.lifecycleAsync(async () => {
        await Time.wait(5);
        throw new Error('Boo', { cause: new Error('Sad') });
      });

      const fired: t.DisposeAsyncEvent[] = [];
      obj.dispose$.subscribe((e) => fired.push(e));

      expect(obj.disposed).to.eql(false);
      const promise = obj.dispose();
      expect(obj.disposed).to.eql(false); // Not yet disposed (async op).
      await promise;
      await promise; // NB: second call.

      expect(fired.length).to.eql(2);
      expect(fired[0].payload.stage).to.eql('start');
      expect(fired[1].payload.stage).to.eql('error');
      expect(fired[1].payload.is).to.eql({ ok: false, done: true });

      const err = fired[1].payload.error;
      expect(err?.cause?.message).to.eql('Boo');
      expect(err?.cause?.cause?.message).to.eql('Sad');

      expect(obj.disposed).to.eql(true);
    });

    it('until$ (parameter)', async () => {
      const test = async (until: t.UntilInput) => {
        let count = 0;
        const obj = Dispose.lifecycleAsync(until, async () => {
          await Time.wait(5);
          count++;
        });

        const fired: t.DisposeAsyncEvent[] = [];
        obj.dispose$.subscribe((e) => fired.push(e));

        obj.dispose();
        obj.dispose(); // NB: multiple calls.

        expect(count).to.eql(0);
        await Time.wait(15);
        expect(count).to.eql(1);

        expect(fired.length).to.eql(2);
        expect(fired[0].payload.stage).to.eql('start');
        expect(fired[1].payload.stage).to.eql('complete');
        expect(fired[1].payload.is).to.eql({ ok: true, done: true });

        expect(obj.disposed).to.eql(true);
      };

      await test(Dispose.disposable());
      await test(Dispose.lifecycle());
      await test([undefined, [undefined, Dispose.disposable()]]); // NB: complex "until" list.
      await test([undefined, [undefined, Dispose.disposable().dispose$]]);
    });

    it('passes reason through dispose$ (direct)', async () => {
      const life = Dispose.lifecycleAsync(async () => {
        await Time.wait(1);
      });

      const fired: t.DisposeAsyncEvent[] = [];
      life.dispose$.subscribe((e) => fired.push(e));

      const reason = 'direct:reason';
      await life.dispose(reason);
      await life.dispose('ignored'); // ← idempotent.

      expect(life.disposed).to.eql(true);
      expect(fired.length).to.eql(2);
      expect(fired[0].payload.stage).to.eql('start');
      expect(fired[0].payload.reason).to.eql(reason);
      expect(fired[1].payload.stage).to.eql('complete');
      expect(fired[1].payload.is).to.eql({ ok: true, done: true });
      expect(fired[1].payload.reason).to.eql(reason);
    });

    it('propagates reason from until$ bridge', async () => {
      const upstream = Dispose.disposable();
      const life = Dispose.lifecycleAsync(upstream, async () => void (await Time.wait(1)));

      const fired: t.DisposeAsyncEvent[] = [];
      life.dispose$.subscribe((e) => fired.push(e));

      const reason = 'upstream:reason';
      upstream.dispose(reason); // ← triggers via bridge.
      await Time.wait(5);

      expect(life.disposed).to.eql(true);
      expect(fired.length).to.eql(2);
      expect(fired[0].payload.stage).to.eql('start');
      expect(fired[0].payload.reason).to.eql(reason);
      expect(fired[1].payload.stage).to.eql('complete');
      expect(fired[1].payload.is).to.eql({ ok: true, done: true });
      expect(fired[1].payload.reason).to.eql(reason);
    });
  });

  describe('Dispose.until', () => {
    it('Input: single (observable)', () => {
      const $ = new Subject<void>();
      const res = Dispose.until($);
      expect(res.length).to.eql(1);
      expect(res[0]).to.equal($);
    });

    it('Input: <t.Disposable>', () => {
      const test = (input: t.Disposable) => {
        const res = Dispose.until(input);
        expect(res.length).to.eql(1);
        expect(res[0]).to.equal(input.dispose$);
      };
      test(rx.disposable());
      test(rx.lifecycle());
    });

    it('Input: list', () => {
      const $1 = new Subject<void>();
      const $2 = rx.disposable();
      const $3 = [undefined, rx.disposable()];
      const res = Dispose.until([$1, undefined, $2, $3]);

      expect(res.length).to.eql(3);
      expect(res[0]).to.equal($1);
      expect(res[1]).to.equal($2.dispose$);
      expect(res[2]).to.equal($3[1]?.dispose$);
    });

    it('Input: deep list ← flattens', () => {
      const $1 = new Subject<void>();
      const $2 = new Subject<void>();
      const res = Dispose.until([$1, undefined, [undefined, [undefined, $2]]]);

      expect(res.length).to.eql(2);
      expect(res[0]).to.eql($1);
      expect(res[1]).to.eql($2);
    });
  });

  describe('Dispose.done', () => {
    it('fires once and completes', () => {
      const dispose$ = new Subject<t.DisposeEvent>();

      let nextCount = 0;
      let completed = false;

      dispose$.subscribe({
        next: () => nextCount++,
        complete: () => (completed = true),
      });

      Dispose.done(dispose$);
      Dispose.done(dispose$);
      Dispose.done(dispose$);

      expect(nextCount).to.eql(1);
      expect(completed).to.eql(true);
    });

    it('with reason', () => {
      const dispose$ = new Subject<any>();
      expect(dispose$.closed).to.eql(false);

      const fired: t.DisposeEvent[] = [];
      dispose$.subscribe((e) => fired.push(e));

      Dispose.done(dispose$, 'a');
      Dispose.done(dispose$, 'b');

      expect(fired.length).to.eql(1);
      expect(fired[0].reason).to.eql('a'); // ← NB: first "reason" only.
    });
  });

  describe('Dispose.toLifecycle', () => {
    it('lifecycle', () => {
      type T = t.Lifecycle & { count: number };
      const life = rx.lifecycle();
      const api = Dispose.toLifecycle<T>(life, { count: 123 });

      let fired = 0;
      api.dispose$.subscribe(() => fired++);

      expect(api.count).to.eql(123);
      expect(api.disposed).to.eql(false);

      life.dispose();
      api.dispose();
      expect(fired).to.eql(1);
      expect(api.disposed).to.eql(true);
    });

    it('(no param) generate lifecycle', () => {
      type T = t.Lifecycle & { count: number };
      const api = Dispose.toLifecycle<T>({ count: 123 });
      let fired = 0;
      api.dispose$.subscribe(() => fired++);

      expect(api.count).to.eql(123);
      expect(api.disposed).to.eql(false);

      api.dispose();
      expect(fired).to.eql(1);
      expect(api.disposed).to.eql(true);
    });
  });

  describe('Dispose.omitDispose', () => {
    type T = t.Lifecycle & { count: number };

    it('from lifecycle', () => {
      const life = Dispose.lifecycle();
      const a = Dispose.toLifecycle<T>(life, { count: 123 });
      expect(typeof a.dispose === 'function').to.be.true;

      const b = Dispose.omitDispose(a);
      expect(a).to.not.equal(b);
      expect((b as any).dispose === undefined).to.be.true;

      let fired = 0;
      b.dispose$.subscribe(() => fired++);

      expect(b.disposed).to.eql(false);
      life.dispose();
      expect(b.disposed).to.eql(true);
      expect(fired).to.eql(1);
    });
  });

  describe('Dispose.abortable', () => {
    it('constructs: default (no until)', () => {
      const a = Dispose.abortable();
      expect(a.disposed).to.eql(false);
      expect(a.signal.aborted).to.eql(false);
      expect(typeof a.dispose).to.eql('function');
      expect(a.controller).to.be.an.instanceOf(AbortController);
      expect(a.signal).to.be.an.instanceOf(AbortSignal);
    });

    it('dispose(): aborts signal + marks disposed', () => {
      const a = Dispose.abortable();
      let abortedEventCount = 0;
      a.signal.addEventListener('abort', () => abortedEventCount++);

      a.dispose();

      expect(a.disposed).to.eql(true);
      expect(a.signal.aborted).to.eql(true);
      expect(abortedEventCount).to.eql(1); // event fired exactly once
    });

    it('idempotent dispose()', () => {
      const a = Dispose.abortable();
      a.dispose();
      const firstAbortedState = a.signal.aborted;
      a.dispose(); // second call should be a no-op
      expect(a.disposed).to.eql(true);
      expect(a.signal.aborted).to.eql(true);
      expect(a.signal.aborted).to.eql(firstAbortedState);
    });

    it('external lifecycle (until: dispose$) triggers abort', () => {
      const { dispose, dispose$ } = rx.lifecycle();
      const a = Dispose.abortable(dispose$);
      expect(a.disposed).to.eql(false);
      expect(a.signal.aborted).to.eql(false);

      dispose(); // disposing upstream lifecycle
      expect(a.disposed).to.eql(true);
      expect(a.signal.aborted).to.eql(true);
    });

    it('abort event fires exactly once even with external + local dispose', () => {
      const { dispose, dispose$ } = rx.lifecycle();
      const a = Dispose.abortable(dispose$);
      let count = 0;
      a.signal.addEventListener('abort', () => count++);

      dispose(); // upstream
      a.dispose(); // local (should be idempotent)
      a.controller.abort(); // manual abort on controller (already aborted)

      expect(count).to.eql(1);
      expect(a.signal.aborted).to.eql(true);
    });

    describe('Dispose.abortable (reason propagation)', () => {
      it('dispose(reason): sets AbortSignal.reason', () => {
        const a = Dispose.abortable();
        const reason = 'direct:reason';
        a.dispose(reason);

        expect(a.disposed).to.eql(true);
        expect(a.signal.aborted).to.eql(true);
        expect(a.signal.reason).to.eql(reason);
      });

      it('idempotent: first reason wins', () => {
        const a = Dispose.abortable();
        a.dispose('first');
        a.dispose('second'); // no-op

        expect(a.signal.aborted).to.eql(true);
        expect(a.signal.reason).to.eql('first');
      });

      it('propagates reason from external until', () => {
        const upstream = Dispose.disposable();
        const a = Dispose.abortable(upstream.dispose$);

        const reason = 'upstream:dispose';
        upstream.dispose(reason); // triggers abort via bridge

        expect(a.disposed).to.eql(true);
        expect(a.signal.aborted).to.eql(true);
        expect(a.signal.reason).to.eql(reason);
      });

      it('preserves Error reason', () => {
        const a = Dispose.abortable();
        const err = new Error('boom');
        a.dispose(err);

        expect(a.signal.aborted).to.eql(true);
        expect(a.signal.reason).to.be.instanceOf(Error);
        expect((a.signal.reason as Error).message).to.eql('boom');
      });
    });
  });
});
