import { type t, AutomergeRepo, describe, expect, it, rx } from '../-test.ts';
import { toRef } from './mod.ts';

describe('CrdtRef: events (observable)', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number; foo: string[] };

  it('fires event: change$', () => {
    const repo = new AutomergeRepo();
    const handle = repo.create<T>({ count: 0, foo: [] });
    const doc = toRef(handle);

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
