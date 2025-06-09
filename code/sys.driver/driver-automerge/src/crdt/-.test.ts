import { Repo } from '@automerge/automerge-repo';
import { type t, describe, expect, it, rx } from '../-test.ts';
import { toRef, toHandle } from './u.toRef.ts';

describe('Crdt', { sanitizeResources: false, sanitizeOps: false }, () => {
  describe('toRef', () => {
    type T = { count: number };

    it('create → change → patches (sequence)', async () => {
      const repo = new Repo();
      const handle = repo.create<T>({ count: 0 });

      const doc = toRef(handle);
      expect(doc.current).to.eql({ count: 0 });
      expect(typeof doc.instance).to.eql('string');

      let patches: t.CrdtPatch[] = [];
      doc.change((d) => (d.count += 1));
      doc.change((d) => (d.count += 1), { patches: (p) => patches.push(...p) });
      doc.change(
        (d) => (d.count += 1),
        (p) => patches.push(...p),
      );

      expect(doc.current.count).to.eql(3);
      expect(patches.length).to.eql(2);

      expect(patches[0].action).to.eql('put');
      expect(patches[1].action).to.eql('put');
      expect(patches[0].path).to.eql(['count']);
      expect(patches[1].path).to.eql(['count']);
    });

    it('toHandle', () => {
      const repo = new Repo();
      const handle = repo.create<T>({ count: 0 });
      const doc = toRef(handle);
      expect(toHandle(doc)).to.equal(handle);
      expect(toHandle({} as any)).to.eql(undefined);
    });

    describe('cache', () => {
      it('retreives from cache', () => {
        const repo = new Repo();
        const handle = repo.create<T>({ count: 0 });
        const a = toRef(handle);
        const b = toRef(handle);
        expect(a).to.equal(b); // NB: cached instance.
      });

      it('removed from cache', () => {
        const life = rx.disposable();
        const repo = new Repo();
        const handle = repo.create<T>({ count: 0 });
        const a = toRef(handle, life);
        life.dispose();
        const b = toRef(handle);
        expect(b).to.not.equal(a);
      });
    });

    describe('events', () => {
      type T = { count: number; foo: string[] };

      it('fires event', () => {
        const repo = new Repo();
        const handle = repo.create<T>({ count: 0, foo: [] });
        const doc = toRef(handle);

        const fired: t.CrdtChange<T>[] = [];
        doc.events().changed$.subscribe((e) => fired.push(e));
        doc.change((d) => (d.count += 1));
        doc.change((d) => d.foo.push('bar'));

        expect(fired.length).to.eql(2);

        expect(fired[0].source).to.eql('change');
        expect(fired[0].before).to.eql({ count: 0, foo: [] });
        expect(fired[0].after).to.eql({ count: 1, foo: [] });
        expect(fired[0].patches).to.eql([{ action: 'put', path: ['count'], value: 1 }]);

        expect(fired[1].source).to.eql('change');
        expect(fired[1].before).to.eql({ count: 1, foo: [] });
        expect(fired[1].after).to.eql({ count: 1, foo: ['bar'] });
        expect(fired[1].patches).to.eql([
          { action: 'insert', path: ['foo', 0], values: [''] },
          { action: 'splice', path: ['foo', 0, 0], value: 'bar' },
        ]);
      });

      it('dispose (via param)', () => {
        const life = rx.disposable();
        const repo = new Repo();
        const handle = repo.create<T>({ count: 0, foo: [] });
        const doc = toRef(handle);

        let fired = 0;
        doc.events(life).changed$.subscribe(() => fired++);
        doc.change((d) => (d.count += 1));
        life.dispose();
        doc.change((d) => (d.count += 1));
        expect(fired).to.eql(1);
      });

      it('dispose (via method)', () => {
        const repo = new Repo();
        const handle = repo.create<T>({ count: 0, foo: [] });
        const doc = toRef(handle);
        const events = doc.events();

        let fired = 0;
        events.changed$.subscribe(() => fired++);
        doc.change((d) => (d.count += 1));
        events.dispose();
        doc.change((d) => (d.count += 1));
        expect(fired).to.eql(1);
      });
    });
  });
});
