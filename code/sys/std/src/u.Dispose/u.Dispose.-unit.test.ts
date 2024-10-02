import { Subject } from 'npm:rxjs';
import { describe, expect, it, type t } from '../-test.ts';
import { Time } from '../u.Time/mod.ts';
import { Dispose } from './mod.ts';

describe('Disposable', () => {
  describe('sync', () => {
    it('disposable: create → dispose', () => {
      const test = (until?: t.UntilObservable) => {
        const obj = Dispose.disposable(until);

        let count = 0;
        obj.dispose$.subscribe(() => count++);

        obj.dispose();
        obj.dispose();
        until?.forEach((subject) => subject.next());

        expect(count).to.eql(1);
      };

      test();
      test(new Subject<void>());
      test([new Subject<void>(), new Subject<void>()]);
    });

    it('lifecycle: create → dispose', () => {
      const test = (until?: t.UntilObservable) => {
        const obj = Dispose.lifecycle(until);
        expect(obj.disposed).to.eql(false);

        let count = 0;
        obj.dispose$.subscribe(() => count++);

        obj.dispose();
        obj.dispose();
        until?.forEach((subject) => subject.next());
        expect(count).to.eql(1); // NB: multiple calls to dispose to not refire the cleanup handler.
      };

      test();
      test(new Subject<void>());
      test([new Subject<void>(), new Subject<void>()]);
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
      const promise = obj.dispose();
      expect(count).to.eql(0); // NB: not yet completed handler.
      expect(fired.length).to.eql(1);
      expect(fired[0].payload.stage).to.eql('start');
      expect(fired[0].payload.is).to.eql({ ok: true, done: false });

      await promise;
      await promise; // NB: second call.
      expect(count).to.eql(1); // NB: multiple calls to dispose to not re-fire the cleanup handler.

      expect(fired.length).to.eql(2);
      expect(fired[1].payload.stage).to.eql('complete');
      expect(fired[1].payload.is).to.eql({ ok: true, done: true });
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

        const promise = obj.dispose();
        await promise;
        await promise; // NB: second call.
        expect(count).to.eql(1); // NB: multiple calls to dispose to not re-fire the cleanup handler.

        expect(fired.length).to.eql(2);
        expect(fired[0].payload.stage).to.eql('start');
        expect(fired[1].payload.stage).to.eql('error');
        expect(fired[1].payload.is).to.eql({ ok: false, done: true });

        const err = fired[1].payload.error;
        expect(err?.name).to.eql('DisposeError');
        expect(err?.message).to.include('Failed while disposing asynchronously');

        return err;
      };

      const err1 = await test(() => 'My String Error');
      expect(err1?.cause?.name).to.eql('Error');
      expect(err1?.cause?.message).to.eql('My String Error'); // NB: converted to [StdError].

      const err2 = await test(() => new Error('My JS Error', { cause: new Error('fail') }));
      expect(err2?.cause?.message).to.eql('My JS Error');
      expect(err2?.cause?.cause?.message).to.eql('fail');
    });

    it('until$ (parameter)', async () => {
      const life = Dispose.disposable();
      let count = 0;
      const until = [undefined, [undefined, life.dispose$]]; // NB: complex "until" list.
      const obj = Dispose.disposableAsync(until, async () => {
        await Time.wait(5);
        count++;
      });

      const fired: t.DisposeAsyncEvent[] = [];
      obj.dispose$.subscribe((e) => fired.push(e));

      life.dispose();
      life.dispose(); // NB: multiple calls.

      expect(count).to.eql(0);
      await Time.wait(15);
      expect(count).to.eql(1);

      expect(fired.length).to.eql(2);
      expect(fired[0].payload.stage).to.eql('start');
      expect(fired[1].payload.stage).to.eql('complete');
      expect(fired[1].payload.is).to.eql({ ok: true, done: true });
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
      const life = Dispose.disposable();
      let count = 0;
      const until = [undefined, [undefined, life.dispose$]]; // NB: complex "until" list.
      const obj = Dispose.lifecycleAsync(until, async () => {
        await Time.wait(5);
        count++;
      });

      const fired: t.DisposeAsyncEvent[] = [];
      obj.dispose$.subscribe((e) => fired.push(e));

      life.dispose();
      life.dispose(); // NB: multiple calls.

      expect(count).to.eql(0);
      await Time.wait(15);
      expect(count).to.eql(1);

      expect(fired.length).to.eql(2);
      expect(fired[0].payload.stage).to.eql('start');
      expect(fired[1].payload.stage).to.eql('complete');
      expect(fired[1].payload.is).to.eql({ ok: true, done: true });

      expect(obj.disposed).to.eql(true);
    });
  });

  describe('Dispose.until', () => {
    it('single', () => {
      const $ = new Subject<void>();
      const res = Dispose.until($);
      expect(res.length).to.eql(1);
      expect(res[0]).to.equal($);
    });

    it('list', () => {
      const $1 = new Subject<void>();
      const $2 = new Subject<void>();
      const res = Dispose.until([$1, undefined, $2]);

      expect(res.length).to.eql(2);
      expect(res[0]).to.eql($1);
      expect(res[1]).to.eql($2);
    });

    it('deep list ← flattens', () => {
      const $1 = new Subject<void>();
      const $2 = new Subject<void>();
      const res = Dispose.until([$1, undefined, [undefined, [undefined, $2]]]);

      expect(res.length).to.eql(2);
      expect(res[0]).to.eql($1);
      expect(res[1]).to.eql($2);
    });
  });

  describe('Dispose.done', () => {
    it('fires and completes a subject', () => {
      const dispose$ = new Subject<void>();

      let count = 0;
      dispose$.subscribe(() => count++);

      Dispose.done(dispose$);
      Dispose.done(dispose$);
      Dispose.done(dispose$);

      expect(count).to.eql(1);
    });
  });
});
