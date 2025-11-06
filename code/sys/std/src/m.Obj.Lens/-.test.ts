import { describe, expect, it } from '../-test.ts';
import { Lens } from './mod.ts';

describe('Obj.Lens', () => {
  it('exports stable surface', async () => {
    const { Obj } = await import('@sys/std/value');
    expect(Obj.Lens).to.equal(Lens);
    expect(Lens).to.have.keys(['at', 'on', 'of', 'ReadOnly']);
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
  });

  describe('bound Lens.on/of', () => {
    it('bind() produces parity with manual subject passing', () => {
      const subject = { a: { b: 1 } };
      const unbound = Lens.at<number>(['a', 'b']);
      const bound = unbound.bind(subject);

      expect(bound.get()).to.eql(unbound.get(subject));
      bound.set(5);
      expect(subject).to.eql({ a: { b: 5 } });

      bound.delete();
      expect(unbound.exists(subject)).to.eql(false);
    });

    it('of() binds to root path []', () => {
      const subject = { x: 1 };
      const lens = Lens.of(subject);
      expect(lens.path).to.eql([]);
      expect(lens.get()).to.eql(subject);
      lens.set({ y: 2 });
      expect(subject).to.eql({ y: 2 });
    });

    it('ensure() creates intermediate objects', () => {
      const s: any = {};
      const l = Lens.on(s, ['a', 'b', 'c']);
      const v = l.ensure(10);
      expect(v).to.eql(10);
      expect(s).to.eql({ a: { b: { c: 10 } } });
    });
  });

  describe('ReadOnly', () => {
    it('matches unbound semantics (get/exists)', () => {
      const obj = { a: { b: 5 } };
      const lens = Lens.ReadOnly.at<number>(['a', 'b']);
      expect(lens.get(obj)).to.eql(5);
      expect(lens.exists(obj)).to.eql(true);
    });

    it('bound ReadOnly lens works and forbids mutation', () => {
      const subject = { a: { b: 2 } };
      const lens = Lens.ReadOnly.on(subject, ['a', 'b']);
      expect(lens.get()).to.eql(2);
      expect(() => (lens as any).set(3)).to.throw;
    });

    it('join() composes correctly on readonly lenses', () => {
      const subject = { x: { y: { z: 1 } } };
      const root = Lens.ReadOnly.on(subject, ['x']);
      const joined = root.join(['y', 'z']);
      expect(joined.get()).to.eql(1);
      expect(joined.path).to.eql(['x', 'y', 'z']);
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
    });
  });
});
