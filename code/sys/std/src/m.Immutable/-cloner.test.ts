import { describe, expect, it, type t } from '../-test.ts';
import { rx } from './common.ts';
import { Immutable } from './mod.ts';

describe('Immutable', () => {
  type P = t.PatchOperation;
  type D = { count: number; list?: number[] };

  describe('Immutable.cloner', () => {
    it('defaults', () => {
      const initial = { count: 0 };
      const obj = Immutable.cloner<D>(initial);
      expect(obj.current).to.not.equal(initial);
      expect(obj.current).to.eql({ count: 0 });

      obj.change((d) => (d.count = 123));
      expect(obj.current).to.eql({ count: 123 });
    });

    it('custom cloner', () => {
      let count = 0;
      const clone = <D>(input: D) => {
        count++;
        return { ...input };
      };
      const initial = { count: 0 };
      const obj = Immutable.cloner<D>({ count: 0 }, { clone });
      expect(obj.current).to.not.equal(initial);
      expect(count).to.eql(1); // NB: initial clone.
      expect(obj.current).to.eql({ count: 0 });

      obj.change((d) => (d.count = 123));
      expect(obj.current).to.eql({ count: 123 });
      expect(count).to.eql(2);
    });

    it('patches (callback)', () => {
      const initial = { count: 0, list: [] };
      const obj = Immutable.cloner<D>(initial);

      const patches: t.PatchOperation[] = [];
      obj.change((d) => (d.count = 123), { patches: (e) => patches.push(...e) });
      obj.change(
        (d) => {
          d.list![0] = 555;
          d.list![9] = 888;
        },
        (e) => patches.push(...e),
      );

      expect(patches.length).to.eql(3);
      expect(patches[0]).to.eql({ op: 'replace', path: '/count', value: 123 });
      expect(patches[1]).to.eql({ op: 'add', path: '/list/0', value: 555 });
      expect(patches[2]).to.eql({ op: 'add', path: '/list/9', value: 888 });
    });
  });

  describe('Immutable.clonerRef', () => {
    it('defaults', () => {
      const initial = { count: 0 };
      const obj = Immutable.clonerRef<D>(initial);
      expect(obj.current).to.not.equal(initial);
      expect(obj.current).to.eql({ count: 0 });

      obj.change((d) => (d.count = 123));
      expect(obj.current).to.eql({ count: 123 });
      expect(obj.instance).to.be.a.string;
    });

    it('change (patches)', () => {
      const initial = { count: 0 };
      const obj = Immutable.clonerRef<D>(initial);
      expect(obj.current).to.not.equal(initial);
      expect(obj.current).to.eql({ count: 0 });

      const patches: t.PatchOperation[] = [];
      obj.change((d) => (d.count = 123), { patches: (e) => patches.push(...e) });
      obj.change(
        (d) => (d.count = 456),
        (e) => patches.push(...e),
      );

      expect(patches).to.eql([
        { op: 'replace', path: '/count', value: 123 },
        { op: 'replace', path: '/count', value: 456 },
      ]);
    });

    it('events', () => {
      const life = rx.disposable();
      const initial = { count: 0 };
      const obj = Immutable.clonerRef<D>(initial);
      const events1 = obj.events(life.dispose$);
      const events2 = obj.events();

      const fired1: t.ImmutableChange<D, P>[] = [];
      const fired2: t.ImmutableChange<D, P>[] = [];
      events1.changed$.subscribe((e) => fired1.push(e));
      events2.changed$.subscribe((e) => fired2.push(e));

      obj.change((d) => (d.count = 123));

      expect(fired1.length).to.eql(1);
      expect(fired1).to.eql(fired2);

      const e = fired1[0];
      expect(e.before).to.eql({ count: 0 });
      expect(e.after).to.eql({ count: 123 });
      expect(e.patches).to.eql([{ op: 'replace', path: '/count', value: 123 }]);

      expect(events1.disposed).to.eql(false);
      expect(events2.disposed).to.eql(false);

      life.dispose();
      expect(events1.disposed).to.eql(true);
      expect(events2.disposed).to.eql(false);
      events2.dispose();
      expect(events2.disposed).to.eql(true);
    });

    it('events continue firing on non-related <events> instances', () => {
      const obj = Immutable.clonerRef<D>({ count: 0 });
      const events1 = obj.events();
      const events2 = obj.events();

      let fired1 = 0;
      let fired2 = 0;
      events1.changed$.subscribe(() => fired1++);
      events2.changed$.subscribe(() => fired2++);

      obj.change((d) => (d.count = 123));
      expect(fired1).to.eql(1);
      expect(fired2).to.eql(1);

      events1.dispose();
      obj.change((d) => (d.count = 456));
      expect(fired1).to.eql(1);
      expect(fired2).to.eql(2);
    });
  });
});
