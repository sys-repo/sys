import { describe, expect, it } from '../../-test.ts';
import { Is } from '../m.Is.ts';
import { Lens } from '../mod.ts';

describe('Obj.Lens', () => {
  it('exports stable surface', async () => {
    const { Obj } = await import('@sys/std/obj');
    expect(Obj.Lens).to.equal(Lens);
    expect(Obj.Lens.Is).to.equal(Is);
  });

  /**
   * Unbound (at) — core surface and semantics
   */
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
      const b = a.at(['bar', 0, 'baz']);
      expect(a.path).to.eql(['foo']);
      expect(b.path).to.eql(['foo', 'bar', 0, 'baz']);
    });

    it('handles pointer string paths with numeric coercion', () => {
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

  /**
   * at(): sanitize-aware behavior (pointer codec)
   */
  describe('Lens.at sanitizes string path inputs', () => {
    it('accepts pointer string without leading slash (ensures leading "/")', () => {
      const l = Lens.at('foo/bar');
      expect(l.path).to.eql(['foo', 'bar']);
    });

    it('collapses multiple slashes and removes trailing slash', () => {
      const l = Lens.at('/a//b///c/');
      expect(l.path).to.eql(['a', 'b', 'c']);
    });

    it('empty string sanitizes to root []', () => {
      const l = Lens.at('');
      expect(l.path).to.eql([]);
      const s = { x: 1 };
      expect(l.get(s)).to.equal(s);
    });

    it('passes through array paths untouched', () => {
      const l = Lens.at(['x', 1, 'y']);
      expect(l.path).to.eql(['x', 1, 'y']);
    });

    it('ignores null/undefined variadic segments', () => {
      const l = Lens.at(undefined, null, '/a');
      expect(l.path).to.eql(['a']);
    });

    it('RFC-6901 escapes: "~1" → "/", "~0" → "~"', () => {
      const l1 = Lens.at('/a~1b/c');
      const l2 = Lens.at('/a~0b/c');
      expect(l1.path).to.eql(['a/b', 'c']);
      expect(l2.path).to.eql(['a~b', 'c']);
    });

    it('dot-notation strings are treated as literal keys (pointer default)', () => {
      const l = Lens.at('a.b[1].c');
      expect(l.path).to.eql(['a.b[1].c']);
    });
  });

  /**
   * Bound (bind) — core surface and semantics
   */
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
      const j = l.at<number>(['b', 'c']);
      expect(j.path).to.eql(['a', 'b', 'c']);
      expect(j.get()).to.eql(1);
      j.set(2);
      expect(s).to.eql({ a: { b: { c: 2 } } });
    });

    it('Lens.bind(subject, ...path) composes and mutates correctly (sanitize in play)', () => {
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

  /**
   * Readonly variants — parity and safety
   */
  describe('Lens.Readonly', () => {
    it('matches unbound semantics (get/exists)', () => {
      const obj = { a: { b: 5 } };
      const lens = Lens.Readonly.at<number>(['a', 'b']);
      expect(lens.get(obj)).to.eql(5);
      expect(lens.exists(obj)).to.eql(true);
    });

    it('Lens.Readonly.bind(subject, path) works and forbids mutation', () => {
      const subject = { a: { b: 2 } };
      const lens = Lens.Readonly.bind(subject, ['a', 'b']);
      expect(lens.get()).to.eql(2);
      expect(() => (lens as any).set(3)).to.throw;
      expect(() => (lens as any).delete()).to.throw;
      expect(() => (lens as any).ensure(0)).to.throw;
    });

    it('Lens.Readonly.bind(subject) binds at root []', () => {
      const subject = { x: { y: 1 } };
      const root = Lens.Readonly.bind(subject);
      expect(root.path).to.eql([]);
      expect(root.get()).to.eql(subject);
    });

    it('join() composes correctly on readonly bound lenses', () => {
      const subject = { x: { y: { z: 1 } } };
      const root = Lens.Readonly.bind(subject, ['x']);
      const joined = root.at<number>(['y', 'z']);
      expect(joined.get()).to.eql(1);
      expect(joined.path).to.eql(['x', 'y', 'z']);
    });

    it('Readonly.at(...path) composes; Readonly.bind(subject, ...path) mirrors (sanitize in play)', () => {
      const s = { a: [{ b: { c: 7 } }] };

      const roA = Lens.Readonly.at<number>('/a/0', ['b'], null, '/c');
      expect(roA.path).to.eql(['a', 0, 'b', 'c']);
      expect(roA.get(s)).to.eql(7);
      expect(roA.exists(s)).to.eql(true);

      const roB = Lens.Readonly.bind(s, '/a', ['0', 'b'], undefined, '/c');
      expect(roB.path).to.eql(['a', 0, 'b', 'c']);
      expect(roB.get()).to.eql(7);
      expect(() => (roB as any).set(8)).to.throw;
    });

    it('Readonly root binding when no/only nullish segments', () => {
      const s = { x: 1 };
      const a = Lens.Readonly.at().bind(s);
      const b = Lens.Readonly.bind(s, null, undefined);
      expect(a.path).to.eql([]);
      expect(b.path).to.eql([]);
      expect(a.get()).to.eql(s);
      expect(b.get()).to.eql(s);
    });

    it('Readonly.at sanitizes sloppy strings', () => {
      const l = Lens.Readonly.at('  foo//bar/  ');
      expect(l.path).to.eql(['foo', 'bar']);
    });

    it('Readonly.at respects RFC-6901 escapes', () => {
      const l = Lens.Readonly.at('/a~1b/~0c');
      expect(l.path).to.eql(['a/b', '~c']);
    });

    it('Readonly.at treats dot-notation strings as literal keys under pointer default', () => {
      const l = Lens.Readonly.at('a.b[1].c');
      expect(l.path).to.eql(['a.b[1].c']);
    });
  });

  /**
   * Parity and invariants
   */
  describe('type parity and invariants', () => {
    it('produces structurally equal bound/unbound paths', () => {
      const unbound = Lens.at(['foo', 'bar']);
      const bound = unbound.bind({});
      expect(bound.path).to.eql(unbound.path);
    });

    it('Readonly lens surface omits mutators', () => {
      const ro = Lens.Readonly.at(['foo']);
      expect(ro).to.not.have.property('set');
      expect(ro).to.not.have.property('ensure');
      expect(ro).to.not.have.property('delete');
      expect(ro).to.have.property('bind');
    });

    it('root-level bind sugar equals at([]).bind(subject)', () => {
      const subject = { a: 1 };
      const a = Lens.bind(subject);
      const b = Lens.at([] as const).bind(subject);
      expect(a.path).to.eql(b.path);
      expect(a.get()).to.eql(b.get());
    });

    it('at() remains stable regardless of how the base path was constructed', () => {
      const s = { r: { a: [{ b: { c: 1 } }] } };

      const a = Lens.at('/r', ['a', 0]).bind(s).at<number>(['b', 'c']);
      const b = Lens.at(['r', 'a', 0, 'b']).bind(s).at<number>(['c']);

      expect(a.path).to.eql(['r', 'a', 0, 'b', 'c']);
      expect(b.path).to.eql(['r', 'a', 0, 'b', 'c']);

      expect(a.get()).to.eql(1);
      expect(b.get()).to.eql(1);

      a.set(2);
      expect(b.get()).to.eql(2);
    });
  });

  /**
   * Edge cases for at() composition and sanitation
   */
  describe('at() path composition edge cases', () => {
    it('RW join: empty args returns same path', () => {
      const s = { a: 1 };
      const l = Lens.bind(s, ['a']);
      const j = l.at();
      expect(j.path).to.eql(l.path);
    });

    it('RW join: nullish args ignored', () => {
      const s = { a: { b: 1 } };
      const l = Lens.bind(s, ['a']);
      const j = l.at(null, undefined);
      expect(j.path).to.eql(l.path);
    });

    it('RW join: pointer + array normalize correctly', () => {
      const s = { x: { y: [{ z: 5 }] } };
      const l = Lens.bind(s, '/x');
      const j = l.at('/y', ['0'], null, '/z');
      expect(j.path).to.eql(['x', 'y', 0, 'z']);
      expect(j.get()).to.eql(5);
    });

    it('RO join: pointer + nullish inputs normalize correctly', () => {
      const s = { x: { y: [{ z: 5 }] } };
      const l = Lens.Readonly.bind(s, '/x');
      const j = l.at('/y', null, '/0', undefined, '/z');
      expect(j.path).to.eql(['x', 'y', 0, 'z']);
      expect(j.get()).to.eql(5);
    });

    it('RO join: empty or nullish yields same lens path', () => {
      const s = { k: 1 };
      const l = Lens.Readonly.bind(s, ['k']);
      const j1 = l.at();
      const j2 = l.at(null, undefined);
      expect(j1.path).to.eql(l.path);
      expect(j2.path).to.eql(l.path);
    });
  });
});
