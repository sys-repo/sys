import { describe, expect, it } from '../-test.ts';
import { Lens } from './mod.ts';

describe('Obj.Lens', () => {
  it('exports stable surface', async () => {
    const { Obj } = await import('@sys/std/value');
    expect(Obj.Lens).to.equal(Lens);
    expect(Lens).to.have.keys(['at', 'bind', 'ReadOnly']);
    expect(Lens.ReadOnly).to.have.keys(['at', 'bind']);
  });

  describe('unbound Lens.at', () => {
    it('get/exists/set/delete/ensure basic roundtrip', () => {
      const lens = Lens.at<number>(['foo', 'bar']);
      const obj: Record<string, unknown> = {};

      expect(lens.exists(obj)).to.eql(false);

      lens.set(obj, 42);
      expect(lens.exists(obj)).to.eql(true);
      expect(lens.get(obj)).to.eql(42);

      lens.delete(obj);
      expect(lens.exists(obj)).to.eql(false);

      const ensured = lens.ensure(obj, 99);
      expect(ensured).to.eql(99);
      expect(lens.get(obj)).to.eql(99);
    });

    it('joins subpaths without mutation', () => {
      const a = Lens.at(['foo']);
      const b = a.join(['bar', 0, 'baz']);
      expect(a.path).to.eql(['foo']);
      expect(b.path).to.eql(['foo', 'bar', 0, 'baz']);
    });

    it('handles string paths (pointer) with numeric coercion', () => {
      const obj = { items: [{ value: 'ok' }] };
      const lens = Lens.at('/items/0/value');
      expect(lens.get(obj)).to.eql('ok');
    });

    it('Lens.at(...path) composes pointer + array + nullish left→right', () => {
      const s = { a: [{ b: { c: 'ok' } }] };
      const lens = Lens.at<string>('/a/0', ['b'], null, undefined, '/c');
      expect(lens.path).to.eql(['a', 0, 'b', 'c']);
      expect(lens.get(s)).to.eql('ok');

      lens.set(s, 'NEW');
      expect(s).to.eql({ a: [{ b: { c: 'NEW' } }] });
    });
  });

  describe('bound Lens.bind', () => {
    it('unbound.bind(subject) parity with manual subject passing', () => {
      const subject = { a: { b: 1 } };
      const unbound = Lens.at<number>(['a', 'b']);
      const bound = unbound.bind(subject);

      expect(bound.get()).to.eql(unbound.get(subject));
      bound.set(5);
      expect(subject).to.eql({ a: { b: 5 } });

      bound.delete();
      expect(unbound.exists(subject)).to.eql(false);
    });

    it('Lens.bind(subject) binds at root []', () => {
      const subject = { x: 1 };
      const lens = Lens.bind(subject);
      expect(lens.path).to.eql([]);
      expect(lens.get()).to.eql(subject);
      lens.set({ y: 2 } as any);
      expect(subject).to.eql({ y: 2 });
    });

    it('Lens.bind(subject, path) ensures intermediate objects', () => {
      const s: any = {};
      const l = Lens.bind(s, ['a', 'b', 'c']);
      const v = l.ensure(10);
      expect(v).to.eql(10);
      expect(s).to.eql({ a: { b: { c: 10 } } });
    });

    it('join() composes on bound lenses and shares subject', () => {
      const s = { a: { b: { c: 1 } } };
      const l = Lens.bind(s, ['a']);
      const j = l.join<number>(['b', 'c']);
      expect(j.path).to.eql(['a', 'b', 'c']);
      expect(j.get()).to.eql(1);
      j.set(2);
      expect(s).to.eql({ a: { b: { c: 2 } } });
    });

    it('Lens.bind(subject, ...path) composes and mutates correctly', () => {
      const s: any = {};
      const l = Lens.bind(s, '/x', ['y', 0], null, '/z');
      expect(l.path).to.eql(['x', 'y', 0, 'z']);

      const v = l.ensure(1);
      expect(v).to.eql(1);
      expect(s).to.eql({ x: { y: [{ z: 1 }] } });

      l.set(2);
      expect(s).to.eql({ x: { y: [{ z: 2 }] } });
    });

    it('empty or all-nullish path binds to root [] (RW)', () => {
      const s = { a: 1 };
      const a = Lens.at().bind(s);
      const b = Lens.bind(s, null, undefined);
      expect(a.path).to.eql([]);
      expect(b.path).to.eql([]);
      expect(a.get()).to.eql(s);
      expect(b.get()).to.eql(s);
    });
  });

  describe('ReadOnly', () => {
    it('matches unbound semantics (get/exists)', () => {
      const obj = { a: { b: 5 } };
      const lens = Lens.ReadOnly.at<number>(['a', 'b']);
      expect(lens.get(obj)).to.eql(5);
      expect(lens.exists(obj)).to.eql(true);
    });

    it('Lens.ReadOnly.bind(subject, path) works and forbids mutation', () => {
      const subject = { a: { b: 2 } };
      const lens = Lens.ReadOnly.bind(subject, ['a', 'b']);
      expect(lens.get()).to.eql(2);
      expect(() => (lens as any).set(3)).to.throw;
      expect(() => (lens as any).delete()).to.throw;
      expect(() => (lens as any).ensure(0)).to.throw;
    });

    it('Lens.ReadOnly.bind(subject) binds at root []', () => {
      const subject = { x: { y: 1 } };
      const root = Lens.ReadOnly.bind(subject);
      expect(root.path).to.eql([]);
      expect(root.get()).to.eql(subject);
    });

    it('join() composes correctly on readonly bound lenses', () => {
      const subject = { x: { y: { z: 1 } } };
      const root = Lens.ReadOnly.bind(subject, ['x']);
      const joined = root.join<number>(['y', 'z']);
      expect(joined.get()).to.eql(1);
      expect(joined.path).to.eql(['x', 'y', 'z']);
    });

    it('ReadOnly.at(...path) composes; ReadOnly.bind(subject, ...path) mirrors', () => {
      const s = { a: [{ b: { c: 7 } }] };

      const roA = Lens.ReadOnly.at<number>('/a/0', ['b'], null, '/c');
      expect(roA.path).to.eql(['a', 0, 'b', 'c']);
      expect(roA.get(s)).to.eql(7);
      expect(roA.exists(s)).to.eql(true);

      const roB = Lens.ReadOnly.bind(s, '/a', ['0', 'b'], undefined, '/c');
      expect(roB.path).to.eql(['a', 0, 'b', 'c']);
      expect(roB.get()).to.eql(7);
      expect(() => (roB as any).set(8)).to.throw;
    });

    it('ReadOnly root binding when no/only nullish segments', () => {
      const s = { x: 1 };
      const a = Lens.ReadOnly.at().bind(s);
      const b = Lens.ReadOnly.bind(s, null, undefined);
      expect(a.path).to.eql([]);
      expect(b.path).to.eql([]);
      expect(a.get()).to.eql(s);
      expect(b.get()).to.eql(s);
    });
  });

  describe('type parity and invariants', () => {
    it('produces structurally equal bound/unbound paths', () => {
      const unbound = Lens.at(['foo', 'bar']);
      const bound = unbound.bind({});
      expect(bound.path).to.eql(unbound.path);
    });

    it('ReadOnly lens surface omits mutators', () => {
      const ro = Lens.ReadOnly.at(['foo']);
      expect(ro).to.not.have.property('set');
      expect(ro).to.not.have.property('ensure');
      expect(ro).to.not.have.property('delete');
      // but has bind
      expect(ro).to.have.property('bind');
    });

    it('root-level bind sugar equals at([]).bind(subject)', () => {
      const subject = { a: 1 };
      const a = Lens.bind(subject);
      const b = Lens.at([] as const).bind(subject);
      expect(a.path).to.eql(b.path);
      expect(a.get()).to.eql(b.get());
    });

    it('join() remains stable regardless of how the base path was constructed', () => {
      const s = { r: { a: [{ b: { c: 1 } }] } };

      // Bind first, then join (unbound join returns CurriedPath without .bind)
      const a = Lens.at('/r', ['a', 0]).bind(s).join<number>(['b', 'c']); // mixed base
      const b = Lens.at(['r', 'a', 0, 'b']).bind(s).join<number>(['c']); // array-only base

      expect(a.path).to.eql(['r', 'a', 0, 'b', 'c']);
      expect(b.path).to.eql(['r', 'a', 0, 'b', 'c']);

      expect(a.get()).to.eql(1);
      expect(b.get()).to.eql(1);

      a.set(2);
      expect(b.get()).to.eql(2);
    });
  });
});
