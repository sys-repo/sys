import { AutomergeRepo, describe, expect, Is, it, rx, type t, Testing } from '../../-test.ts';
import { Crdt } from '../../m.Server/common.ts';
import { toRef } from '../mod.ts';

describe('CrdtRef: events (observable)', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number; foo: string[] };

  const sample = () => {
    const repo = new AutomergeRepo();
    const handle = repo.create<T>({ count: 0, foo: [] });
    const doc = toRef<T>(handle);
    return { doc, repo } as const;
  };

  it('events.$ (change)', async () => {
    const { doc } = sample();

    const fired: t.CrdtChange<T>[] = [];
    doc.events().$.subscribe((e) => fired.push(e));

    doc.change((d) => (d.count += 1));
    doc.change((d) => d.foo.push('bar'));

    // events fire next microtask now — wait until both arrived
    await Testing.until(() => fired.length === 2);

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

    it('path( single path )', async () => {
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

      // 1) push to foo -> should match 'foo' (non-exact) only
      doc.change((d) => d.foo.push('hello'));

      await Testing.until(
        () =>
          firedA.length === 0 && firedB.length === 1 && firedC.length === 0 && firedD.length === 0,
      );

      // 2) insert at index 1, then push again -> first insert matches ['foo', 1]
      doc.change((d) => {
        d.foo.splice(1, 0, '👋');
        d.foo.push('🌳'); // this one should not match ['foo', 1]
      });

      await Testing.until(() => firedD.length === 1);
      expect(firedC).to.eql([]);
    });

    it('path( mulitple paths )', async () => {
      const { doc } = sample();
      const events = doc.events();
      const path = events.path([['count'], ['foo', 1]]);

      type C = t.CrdtChange<T>;
      const fired: C[] = [];
      path.$.subscribe((e) => fired.push(e));

      doc.change((d) => (d.count = 123));
      await Testing.until(() => fired.length === 1);

      doc.change((d) => d.foo.push('one'));
      await Testing.wait();
      expect(fired.length).to.eql(1);

      doc.change((d) => d.foo.push('two'));
      await Testing.until(() => fired.length === 2);
    });
  });

  describe('dispose', () => {
    it('dispose events (via param)', async () => {
      const life = rx.disposable();
      const repo = new AutomergeRepo();
      const handle = repo.create<T>({ count: 0, foo: [] });
      const doc = toRef(handle);

      let fired = 0;
      doc.events(life).$.subscribe(() => fired++);

      // Trigger one change:
      doc.change((d) => (d.count += 1));

      // Wait for the deferred emission to arrive:
      await Testing.until(() => fired === 1);

      // Dispose the lifecycle-bound stream:
      life.dispose();

      // Further changes should not emit:
      doc.change((d) => (d.count += 1));
      await Testing.wait();
      expect(fired).to.eql(1);
    });

    it('dispose events (via method)', async () => {
      const repo = new AutomergeRepo();
      const handle = repo.create<T>({ count: 0, foo: [] });
      const doc = toRef(handle);
      const events = doc.events();

      let fired = 0;
      events.$.subscribe(() => fired++);

      // First change → one deferred emission:
      doc.change((d) => (d.count += 1));
      await Testing.until(() => fired === 1);

      // Dispose the events stream, then attempt another change:
      events.dispose();
      doc.change((d) => (d.count += 1));

      // Allow microtasks; no further emissions should arrive:
      await Testing.wait();
      expect(fired).to.eql(1);
    });

    it('dispose events (via doc)', async () => {
      const repo = new AutomergeRepo();
      const handle = repo.create<T>({ count: 0, foo: [] });
      const doc = toRef(handle);
      expect(doc.disposed).to.eql(false);

      let fired = 0;
      doc.events().$.subscribe(() => fired++);

      // First change → one deferred event:
      doc.change((d) => (d.count += 1));
      await Testing.until(() => fired === 1);

      // Dispose and try another change (should NOT emit):
      doc.dispose();
      doc.change((d) => (d.count += 1));

      // Give the microtask queue a chance (nothing should arrive):
      await Testing.wait();
      expect(fired).to.eql(1);
    });
  });
});
