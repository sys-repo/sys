import { type t, describe, expect, it } from '../-test.ts';
import { rx, Is } from './common.ts';
import { Immutable } from './mod.ts';

describe('Immutable Events', () => {
  type P = t.PatchOperation;
  type C = t.ImmutableChange<D, P>;
  type D = { count: number; list: (string | number)[] };

  describe('Immutable.events.viaOverride', () => {
    it('overrides change handler', () => {
      const obj = Immutable.cloner<D>({ count: 0, list: [] });
      const change = obj.change;
      Immutable.Events.viaOverride(obj);
      expect(obj.change).to.not.equal(change);
    });

    it('fires events by overriding change handler', () => {
      const obj = Immutable.cloner<D>({ count: 0, list: [] });
      const events = Immutable.Events.viaOverride(obj);

      const fired: t.ImmutableChange<D, P>[] = [];
      events.$.subscribe((e) => fired.push(e));

      obj.change((d) => (d.count = 123));
      expect(fired.length).to.eql(1);
      expect(fired[0].before).to.eql({ count: 0, list: [] });
      expect(fired[0].after).to.eql({ count: 123, list: [] });
    });

    it('patches: matches fired event', () => {
      const obj = Immutable.cloner<D>({ count: 0, list: [] });
      const events = Immutable.Events.viaOverride(obj);

      const patches: t.PatchOperation[] = [];
      const fired: t.ImmutableChange<D, P>[] = [];
      events.$.subscribe((e) => fired.push(e));

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

    describe('path() ← filter', () => {
      type PathEvents = t.ImmutablePathEvents<
        D,
        t.PatchOperation,
        t.ImmutableChange<D, t.PatchOperation>
      >;

      it('create', () => {
        const obj = Immutable.cloner<D>({ count: 0, list: [] });
        const events = Immutable.Events.viaOverride(obj);
        const a = events.path([]);
        const b = events.path([['list', 1], ['count']]);
        const c = events.path(['list'], { exact: true });
        const d = events.path(['list'], true);
        const e = events.path(['list', 0]);

        const assert = (subject: PathEvents, exact: boolean, paths: t.ObjectPath[]) => {
          expect(subject.match.paths).to.eql(paths);
          expect(subject.match.exact).to.eql(exact);
        };

        assert(a, false, []);
        assert(events.path([[]]), false, []);
        assert(events.path([[], []]), false, []);

        assert(b, false, [['list', 1], ['count']]);
        assert(c, true, [['list']]);

        assert(d, true, [['list']]);
        assert(e, false, [['list', 0]]);

        expect(Is.observable(a.$)).to.be.true;
        expect(a.$).to.not.equal(events.$);
      });

      it('path( single path )', () => {
        const obj = Immutable.cloner<D>({ count: 0, list: [] });
        const events = Immutable.Events.viaOverride(obj);

        const firedA: C[] = [];
        const firedB: C[] = [];
        const firedC: C[] = [];
        const firedD: C[] = [];

        const a = events.path([]);
        const b = events.path(['list']);
        const c = events.path(['list'], { exact: true });
        const d = events.path(['list', 1]);

        a.$.subscribe((e) => firedA.push(e));
        b.$.subscribe((e) => firedB.push(e));
        c.$.subscribe((e) => firedC.push(e));
        d.$.subscribe((e) => firedD.push(e));

        obj.change((d) => d.list.push('hello'));

        expect(firedA.length).to.eql(0); // NB: no path match.
        expect(firedB.length).to.eql(1);
        expect(firedC.length).to.eql(0); // NB: exact match required
        expect(firedD.length).to.eql(0); // NB: no match - not the specified index.

        obj.change((d) => {
          d.list.splice(1, 0, '👋');
          d.list.push('🌳'); // NB: follow on inserts do not match specific index paths.
        });

        expect(firedC).to.eql([]);
        expect(firedD.length).to.eql(1); // NB: matched first index only.
        expect(firedD.length).to.eql(1); // NB: matched first index only.
      });

      it('path( mulitple paths )', () => {
        const obj = Immutable.cloner<D>({ count: 0, list: [] });
        const events = Immutable.Events.viaOverride(obj);
        const path = events.path([['count'], ['list', 1]]);

        const fired: C[] = [];
        path.$.subscribe((e) => fired.push(e));

        obj.change((d) => (d.count = 123));
        expect(fired.length).to.eql(1);

        obj.change((d) => d.list.push('one'));
        expect(fired.length).to.eql(1);

        obj.change((d) => d.list.push('two'));
        expect(fired.length).to.eql(2);
      });
    });

    describe('dispose', () => {
      it('via method', () => {
        const obj = Immutable.cloner<D>({ count: 0, list: [] });
        const events = Immutable.Events.viaOverride(obj);
        const fired: t.ImmutableChange<D, P>[] = [];
        events.$.subscribe((e) => fired.push(e));
        events.dispose();
        expect(events.disposed).to.eql(true);

        obj.change((d) => (d.count = 123));
        expect(fired.length).to.eql(0);
        expect(obj.current).to.eql({ count: 123, list: [] });
      });

      it('via {dispose$} observable', () => {
        const life = rx.lifecycle();
        const obj = Immutable.cloner<D>({ count: 0, list: [] });
        const events = Immutable.Events.viaOverride(obj, life.dispose$);
        const fired: t.ImmutableChange<D, P>[] = [];
        events.$.subscribe((e) => fired.push(e));
        life.dispose();
        expect(events.disposed).to.eql(true);

        obj.change((d) => (d.count = 123));
        expect(fired.length).to.eql(0);
        expect(obj.current).to.eql({ count: 123, list: [] });
      });

      it('reverts handler upon dispose', () => {
        const obj = Immutable.cloner<D>({ count: 0, list: [] });
        const change = obj.change;
        const events = Immutable.Events.viaOverride(obj);
        expect(obj.change).to.not.equal(change);
        events.dispose();
        expect(obj.change).to.equal(change);
      });
    });
  });
});
