import { type t, AutomergeRepo, describe, expect, Is, it, rx } from '../-test.ts';
import { toRef } from './mod.ts';
import { Crdt } from '../m.Server/common.ts';

describe('CrdtRef: events (observable)', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number; foo: string[] };

  const sample = () => {
    const repo = new AutomergeRepo();
    const handle = repo.create<T>({ count: 0, foo: [] });
    const doc = toRef<T>(handle);
    return { doc, repo } as const;
  };

  it('events.$ (change)', () => {
    const { doc } = sample();

    const fired: t.CrdtChange<T>[] = [];
    doc.events().$.subscribe((e) => fired.push(e));
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

  it('events.deleted$', async () => {
    const repo = Crdt.repo();
    const doc = repo.create<T>({ count: 0, foo: [] });
    expect(doc.deleted).to.eql(false);

    const fired: t.CrdtDeleted[] = [];
    doc.events().deleted$.subscribe((e) => fired.push(e));

    const id = doc.id;
    await repo.delete(id);
    expect(doc.deleted).to.eql(true);
    expect(doc.disposed).to.eql(true);
  });

  describe('path()', () => {
    it('create', () => {
      const { doc } = sample();
      const events = doc.events();
      const a = events.path([]);
      const b = events.path([['foo', 1], ['count']]);
      const c = events.path(['foo'], { exact: true });
      const d = events.path(['foo'], true);
      const e = events.path(['foo', 0]);

      const assert = (subject: t.CrdtPathEvents<T>, exact: boolean, paths: t.ObjectPath[]) => {
        expect(subject.match.paths).to.eql(paths);
        expect(subject.match.exact).to.eql(exact);
      };

      assert(a, false, []);
      assert(events.path([[]]), false, []);
      assert(events.path([[], []]), false, []);

      assert(b, false, [['foo', 1], ['count']]);
      assert(c, true, [['foo']]);

      assert(d, true, [['foo']]);
      assert(e, false, [['foo', 0]]);

      expect(Is.observable(a.$)).to.be.true;
      expect(a.$).to.not.equal(events.$);
    });

    it('path( single path )', () => {
      const { doc } = sample();
      const events = doc.events();

      type C = t.CrdtChange<T>;
      const firedA: C[] = [];
      const firedB: C[] = [];
      const firedC: C[] = [];
      const firedD: C[] = [];

      const a = events.path([]);
      const b = events.path(['foo']);
      const c = events.path(['foo'], { exact: true });
      const d = events.path(['foo', 1]);

      a.$.subscribe((e) => firedA.push(e));
      b.$.subscribe((e) => firedB.push(e));
      c.$.subscribe((e) => firedC.push(e));
      d.$.subscribe((e) => firedD.push(e));

      doc.change((d) => d.foo.push('hello'));

      expect(firedA.length).to.eql(0); // NB: no path match.
      expect(firedB.length).to.eql(1);
      expect(firedC.length).to.eql(0); // NB: exact match required
      expect(firedD.length).to.eql(0); // NB: no match - not the specified index.

      doc.change((d) => {
        d.foo.splice(1, 0, '👋');
        d.foo.push('🌳'); // NB: follow on inserts do not match specific index paths.
      });

      expect(firedC).to.eql([]);
      expect(firedD.length).to.eql(1); // NB: matched first index only.
      expect(firedD.length).to.eql(1); // NB: matched first index only.
    });

    it('path( mulitple paths )', () => {
      const { doc } = sample();
      const events = doc.events();
      const path = events.path([['count'], ['foo', 1]]);

      type C = t.CrdtChange<T>;
      const fired: C[] = [];
      path.$.subscribe((e) => fired.push(e));

      doc.change((d) => (d.count = 123));
      expect(fired.length).to.eql(1);

      doc.change((d) => d.foo.push('one'));
      expect(fired.length).to.eql(1);

      doc.change((d) => d.foo.push('two'));
      expect(fired.length).to.eql(2);
    });
  });

  describe('dispose', () => {
    it('dispose events (via param)', () => {
      const life = rx.disposable();
      const repo = new AutomergeRepo();
      const handle = repo.create<T>({ count: 0, foo: [] });
      const doc = toRef(handle);

      let fired = 0;
      doc.events(life).$.subscribe(() => fired++);
      doc.change((d) => (d.count += 1));
      life.dispose();
      doc.change((d) => (d.count += 1));
      expect(fired).to.eql(1);
    });

    it('dispose events (via method)', () => {
      const repo = new AutomergeRepo();
      const handle = repo.create<T>({ count: 0, foo: [] });
      const doc = toRef(handle);
      const events = doc.events();

      let fired = 0;
      events.$.subscribe(() => fired++);
      doc.change((d) => (d.count += 1));
      events.dispose();
      doc.change((d) => (d.count += 1));
      expect(fired).to.eql(1); // NB: no change after disposal.
    });

    it('dispose events (via doc)', () => {
      const repo = new AutomergeRepo();
      const handle = repo.create<T>({ count: 0, foo: [] });
      const doc = toRef(handle);
      expect(doc.disposed).to.eql(false);

      let fired = 0;
      doc.events().$.subscribe(() => fired++);

      doc.change((d) => (d.count += 1));
      doc.dispose();
      doc.change((d) => (d.count += 1));
      expect(fired).to.eql(1); // NB: no change after disposal.
    });
  });
});
