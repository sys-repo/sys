import { describe, expect, Immutable, it, type t } from '../-test.ts';
import { PatchState } from './mod.ts';

describe('Immutable.Events', () => {
  type P = t.PatchOperation;

  it('fires events by overriding change handler', () => {
    type D = { count: number };
    const obj = PatchState.create<D>({ count: 0 });
    const change = obj.change;
    const a = obj.events();
    const b = Immutable.Events.viaOverride(obj);
    expect(obj.change).to.not.equal(change);

    const firedA: t.PatchChange<D>[] = [];
    const firedB: t.ImmutableChange<D, P>[] = [];
    a.patch$.subscribe((e) => firedA.push(e));
    b.$.subscribe((e) => firedB.push(e));

    obj.change((d) => (d.count = 123));
    expect(firedA.length).to.eql(1);
    expect(firedB.length).to.eql(1);
    expect(firedA[0].before).to.eql({ count: 0 });
    expect(firedA[0].after).to.eql({ count: 123 });

    expect(firedB[0].before).to.eql({ count: 0 });
    expect(firedB[0].after).to.eql({ count: 123 });

    b.dispose();
    expect(obj.change).to.equal(change);

    obj.change((d) => (d.count = 456));
    expect(firedA.length).to.eql(2);
    expect(firedB.length).to.eql(1); // NB: no change.
    expect(firedA[1].before).to.eql({ count: 123 });
    expect(firedA[1].after).to.eql({ count: 456 });

    a.dispose();
  });

  it('filters on path', () => {
    type D = { count: number; foo: number[] };
    type E = t.ImmutableChange<D, t.PatchOperation>;

    const obj = PatchState.create<D>({ count: 0, foo: [] });
    const events = Immutable.Events.viaOverride(obj);

    const a = events.path(['count']);
    const b = events.path(['foo']);
    const c = events.path(['foo', 1]);

    const firedA: E[] = [];
    const firedB: E[] = [];
    const firedC: E[] = [];
    a.$.subscribe((e) => firedA.push(e));
    b.$.subscribe((e) => firedB.push(e));
    c.$.subscribe((e) => firedC.push(e));

    obj.change((d) => d.count++);
    expect(firedA.length).to.eql(1);
    expect(firedB.length).to.eql(0);
    expect(firedC.length).to.eql(0);

    obj.change((d) => d.foo.push(123));
    expect(firedA.length).to.eql(1);
    expect(firedB.length).to.eql(1);
    expect(firedC.length).to.eql(0);

    obj.change((d) => d.foo.push(123));
    expect(firedA.length).to.eql(1);
    expect(firedB.length).to.eql(2);
    expect(firedC.length).to.eql(1);
  });
});
