import { describe, expect, it, type t } from '../-test.ts';
import { rx } from './common.ts';
import { Immutable } from './mod.ts';

describe('Immutable', () => {
  type P = t.PatchOperation;
  type D = { count: number; list?: number[] };

  describe('Immutable.Is', () => {
    const Is = Immutable.Is;
    const NON = [123, 'abc', [], {}, undefined, null, true, Symbol('foo'), BigInt(0)];

    it('Is.immutable', () => {
      NON.forEach((v) => expect(Is.immutable(v)).to.eql(false));
      const obj = Immutable.cloner<D>({ count: 0 });
      expect(Is.immutable(obj)).to.eql(true);
    });

    it('Is.immutableRef', () => {
      NON.forEach((v) => expect(Is.immutable(v)).to.eql(false));
      const obj = Immutable.cloner<D>({ count: 0 });
      const objRef = Immutable.clonerRef<D>({ count: 0 });
      expect(Is.immutableRef(obj)).to.eql(false);
      expect(Is.immutableRef(objRef)).to.eql(true);
    });
  });

  describe('Immutable.events.viaOverride', () => {
    it('overrides change handler', () => {
      const obj = Immutable.cloner<D>({ count: 0 });
      const change = obj.change;
      Immutable.events.viaOverride(obj);
      expect(obj.change).to.not.equal(change);
    });

    it('fires events by overriding change handler', () => {
      const obj = Immutable.cloner<D>({ count: 0 });
      const events = Immutable.events.viaOverride(obj);

      const fired: t.ImmutableChange<D, P>[] = [];
      events.changed$.subscribe((e) => fired.push(e));

      obj.change((d) => (d.count = 123));
      expect(fired.length).to.eql(1);
      expect(fired[0].before).to.eql({ count: 0 });
      expect(fired[0].after).to.eql({ count: 123 });
    });

    it('patches: matches fired event', () => {
      const obj = Immutable.cloner<D>({ count: 0 });
      const events = Immutable.events.viaOverride(obj);

      const patches: t.PatchOperation[] = [];
      const fired: t.ImmutableChange<D, P>[] = [];
      events.changed$.subscribe((e) => fired.push(e));

      obj.change(
        (d) => (d.count = 123),
        (e) => patches.push(...e),
      );

      expect(fired.length).to.eql(1);
      expect(patches.length).to.eql(1);
      expect(patches.length).to.eql(1);
      expect(patches[0]).to.eql({ op: 'replace', path: '/count', value: 123 });
      expect(fired[0].patches[0]).to.eql(patches[0]);
    });

    describe('dispose', () => {
      it('via method', () => {
        const obj = Immutable.cloner<D>({ count: 0 });
        const events = Immutable.events.viaOverride(obj);
        const fired: t.ImmutableChange<D, P>[] = [];
        events.changed$.subscribe((e) => fired.push(e));
        events.dispose();
        expect(events.disposed).to.eql(true);

        obj.change((d) => (d.count = 123));
        expect(fired.length).to.eql(0);
        expect(obj.current).to.eql({ count: 123 });
      });

      it('via {dispose$} observable', () => {
        const life = rx.lifecycle();
        const obj = Immutable.cloner<D>({ count: 0 });
        const events = Immutable.events.viaOverride(obj, life.dispose$);
        const fired: t.ImmutableChange<D, P>[] = [];
        events.changed$.subscribe((e) => fired.push(e));
        life.dispose();
        expect(events.disposed).to.eql(true);

        obj.change((d) => (d.count = 123));
        expect(fired.length).to.eql(0);
        expect(obj.current).to.eql({ count: 123 });
      });

      it('reverts handler upon dispose', () => {
        const obj = Immutable.cloner<D>({ count: 0 });
        const change = obj.change;
        const events = Immutable.events.viaOverride(obj);
        expect(obj.change).to.not.equal(change);
        events.dispose();
        expect(obj.change).to.equal(change);
      });
    });
  });
});
