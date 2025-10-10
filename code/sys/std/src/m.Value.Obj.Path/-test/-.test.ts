import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';

import { Obj } from '../../m.Value.Obj/mod.ts';
import { Value } from '../../m.Value/mod.ts';
import { Codec } from '../m.Codec.ts';
import { decode, encode } from '../m.Codec.u.ts';
import { Is } from '../m.Is.ts';
import { del } from '../m.Mutate.delete.ts';
import { diff } from '../m.Mutate.diff.ts';
import { Rel } from '../m.Rel.ts';
import { Path } from '../mod.ts';

describe('Obj.Path', () => {
  it('API', () => {
    expect(Obj.Path).to.equal(Path);
    expect(Value.Obj.Path).to.equal(Path);
    expect(Obj.Path.Mutate.diff).to.equal(diff);
    expect(Obj.Path.Mutate.delete).to.equal(del);
    expect(Obj.Path.Codec).to.equal(Codec);
    expect(Obj.Path.encode).to.equal(encode);
    expect(Obj.Path.decode).to.equal(decode);
    expect(Obj.Path.Rel).to.equal(Rel);
    expect(Obj.Path.Is).to.equal(Is);
  });

  describe('Path.get', () => {
    type Foo = { bar: (string | { baz: string })[]; empty?: string | null };
    type T = { foo: Foo };
    const sample: T = {
      foo: {
        bar: ['zero', { baz: 'found' }],
        empty: null,
      },
    };

    it('retrieves a shallow property', () => {
      const value = Obj.Path.get<Foo>(sample, ['foo']);
      expect(value).to.equal(sample.foo);
      expectTypeOf(value).toEqualTypeOf<Foo | undefined>();
    });

    it('retrieves a deeply nested value (mixed segments)', () => {
      const value = Obj.Path.get<string>(sample, ['foo', 'bar', 1, 'baz']);
      expect(value).to.eql('found');
      expectTypeOf(value).toEqualTypeOf<string | undefined>(); // Type is string | undefined (no default):
    });

    it('returns <undefined> when the path is missing', () => {
      const value = Obj.Path.get<number>(sample, ['foo', 'bar', 99, 'nope']);
      expect(value).to.be.undefined;
      expectTypeOf(value).toEqualTypeOf<number | undefined>();
    });

    it('returns the provided default when the path is missing', () => {
      const value = Obj.Path.get<string>(sample, ['foo', 'bar', 99, 'nope'], 'my-default');
      expect(value).to.eql('my-default');
      expectTypeOf(value).toEqualTypeOf<string>(); // Default supplied → never undefined:
    });

    it('short-circuits when an intermediate segment is null/undefined', () => {
      const value = Obj.Path.get<string>(sample, ['foo', 'empty', 'x'], 'fallback');
      expect(value).to.eql('fallback');
      expectTypeOf(value).toEqualTypeOf<string>();
    });

    it('subject is <undefined>', () => {
      const value = Obj.Path.get<string>(undefined, ['foo'], 'my-value');
      expect(value).to.eql('my-value');
    });
  });

  describe('Path.exists', () => {
    const root = {
      foo: {
        arr: [1, 2, 3],
        bar: {
          baz: 42,
          qux: undefined, // ← value is undefined but slot exists.
        },
      },
    };

    it('returns true for an existing nested key', () => {
      expect(Path.exists(root, ['foo', 'bar', 'baz'])).to.be.true;
    });

    it('returns true when the key exists but the value is undefined', () => {
      expect(Path.exists(root, ['foo', 'bar', 'qux'])).to.be.true;
    });

    it('returns false when the key does not exist', () => {
      expect(Path.exists(root, ['foo', 'bar', 'missing'])).to.be.false;
    });

    it('treats any numeric index as valid on an array (in-bounds or out-of-bounds)', () => {
      expect(Path.exists(root, ['foo', 'arr', 1])).to.be.true; //  ← in-bounds
      expect(Path.exists(root, ['foo', 'arr', 99])).to.be.true; // ← out-of-bounds
    });

    it('returns true for numeric keys on plain objects', () => {
      const obj = { 0: 'zero' };
      expect(Path.exists(obj, [0])).to.be.true;
    });

    it('returns false when the path array is empty', () => {
      expect(Path.exists(root, [])).to.be.false;
    });

    it('returns false when traversal hits a non-object before the end of the path', () => {
      const fixture = { foo: 123 };
      expect(Path.exists(fixture, ['foo', 'bar'])).to.be.false;
    });

    it('ignores keys inherited from the prototype chain', () => {
      const proto = { p: 1 };
      const child = Object.create(proto);
      expect(Path.exists(child, ['p'])).to.be.false;
    });

    it('subject is <undefined>', () => {
      const value = Obj.Path.exists(undefined, ['foo']);
      expect(value).to.eql(false);
    });
  });

  describe('Path.eql', () => {
    it('true for same reference', () => {
      const p: (string | number)[] = ['a', 'b'];
      expect(Path.eql(p, p)).to.eql(true);
    });

    it('true for equal-by-value arrays', () => {
      const a = ['a', 'b'];
      const b = ['a', 'b'];
      expect(Path.eql(a, b)).to.eql(true);
    });

    it('false when order differs', () => {
      expect(Path.eql(['a', 'b'], ['b', 'a'])).to.eql(false);
    });

    it('false when lengths differ', () => {
      expect(Path.eql(['a'], ['a', 'b'])).to.eql(false);
    });

    it('false when either is undefined', () => {
      expect(Path.eql(['a', 'b'], undefined)).to.eql(false);
      expect(Path.eql(undefined, ['a', 'b'])).to.eql(false);
      expect(Path.eql(undefined, undefined)).to.eql(false);
    });

    it('true for two empty paths', () => {
      expect(Path.eql([], [])).to.eql(true);
    });

    it('strict equality of parts (number vs string)', () => {
      expect(Path.eql(['items', 0, 'id'], ['items', 0, 'id'])).to.eql(true);
      expect(Path.eql(['items', 0, 'id'], ['items', '0', 'id'])).to.eql(false);
    });

    it('handles mixed nested shapes', () => {
      const a = ['Root', 'Arrow', 'Left'];
      const b = ['Root', 'Arrow', 'Left'];
      const c = ['Root', 'Arrow', 'Right'];
      expect(Path.eql(a, b)).to.eql(true);
      expect(Path.eql(a, c)).to.eql(false);
    });
  });

  describe('Path.join', () => {
    const A = ['foo', 'bar'] as t.ObjectPath;
    const R = ['traits', 0, 'id'] as t.ObjectPath;

    it('type: returns ObjectPath (default mode: absolute)', () => {
      const out = Path.join(A, R);
      expectTypeOf(out).toEqualTypeOf<t.ObjectPath>();
    });

    it('absolute (default): base + rel', () => {
      const out = Path.join(A, R);
      expect(out).to.eql(['foo', 'bar', 'traits', 0, 'id']);
    });

    it('absolute: empty base → rel', () => {
      const out = Path.join([], R, 'absolute');
      expect(out).to.eql(R);
    });

    it('absolute: empty/undefined rel → base', () => {
      expect(Path.join(A, [], 'absolute')).to.eql(A);
      expect(Path.join(A, undefined, 'absolute')).to.eql(A);
    });

    it('relative: rel unchanged; base ignored', () => {
      const out = Path.join(A, R, 'relative');
      expect(out).to.eql(R);
    });

    it('relative: empty/undefined rel → []', () => {
      expect(Path.join(A, [], 'relative')).to.eql([]);
      expect(Path.join(A, undefined, 'relative')).to.eql([]);
    });

    it('preserves numeric tokens (no string coercion)', () => {
      const out = Path.join(['a'], ['b', 1, 'c'] as t.ObjectPath);
      expect(out).to.eql(['a', 'b', 1, 'c']);
      expect(typeof out[2]).to.eql('number');
    });

    it('does not mutate inputs', () => {
      const base: t.ObjectPath = ['x', 'y'];
      const rel: t.ObjectPath = ['z', 2];
      const baseSnap = [...base];
      const relSnap = [...rel];

      const _ = Path.join(base, rel); // exercise

      expect(base).to.eql(baseSnap);
      expect(rel).to.eql(relSnap);
    });

    it('idempotence on empty rel under absolute; on rel under relative', () => {
      expect(Path.join(A, [], 'absolute')).to.eql(A); // absolute: identity(base)
      expect(Path.join(A, R, 'relative')).to.eql(R); //  relative: identity(rel)
    });
  });

  describe('Path.slice', () => {
    const base: t.ObjectPath = ['a', 'b', 'c', 'd'];

    it('returns a subpath (canonical slice semantics)', () => {
      const res = Path.slice(base, 1, 3);
      expect(res).to.eql(['b', 'c']);
    });

    it('omitting end returns remainder of path', () => {
      const res = Path.slice(base, 2);
      expect(res).to.eql(['c', 'd']);
    });

    it('start beyond length returns empty array', () => {
      const res = Path.slice(base, 10);
      expect(res).to.eql([]);
    });

    it('negative start indexes from end', () => {
      const res = Path.slice(base, -2);
      expect(res).to.eql(['c', 'd']);
    });

    it('negative end is relative to end', () => {
      const res = Path.slice(base, 0, -1);
      expect(res).to.eql(['a', 'b', 'c']);
    });

    it('does not mutate the original path (immutability)', () => {
      const copy = [...base];
      const res = Path.slice(base, 1, 3);
      expect(base).to.eql(copy); //       original unchanged
      expect(res).to.not.equal(base); //  new instance
    });
  });
});
