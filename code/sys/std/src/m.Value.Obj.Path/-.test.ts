import { type t, c, describe, expect, expectTypeOf, it } from '../-test.ts';
import { Str } from '../m.Value.Str/mod.ts';

import { Obj } from '../m.Value.Obj/mod.ts';
import { Value } from '../m.Value/mod.ts';
import { Codec } from './m.Codec.ts';
import { CurriedPath } from './m.CurriedPath.ts';
import { del } from './m.Mutate.delete.ts';
import { diff } from './m.Mutate.diff.ts';
import { Path } from './mod.ts';

type O = Record<string, unknown>;

describe('Value.Obj.Path', () => {
  it('API', () => {
    expect(Obj.Path).to.equal(Path);
    expect(Value.Obj.Path).to.equal(Path);
    expect(Obj.Path.Mutate.diff).to.equal(diff);
    expect(Obj.Path.Mutate.delete).to.equal(del);
    expect(Obj.Path.Codec).to.equal(Codec);
    expect(Obj.Path.codec).to.eql(Codec.default);
    expect(Obj.Path.encode).to.eql(Codec.default.encode);
    expect(Obj.Path.decode).to.eql(Codec.default.decode);
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

  describe('Path.Mutate', () => {
    const Mutate = Obj.Path.Mutate;

    describe('Mutate.set', () => {
      it('throws an error when path is empty', () => {
        const target = {};
        const fn = () => Mutate.set(target as any, [], 1);
        expect(fn).to.throw(/The path-array must contain at least one segment/);
      });

      it('sets a value at a top-level key', () => {
        const target: Record<string, unknown> = {};
        const op = Mutate.set(target, ['key'], 'value');
        expect(target.key).to.eql('value');
        expect(op).to.eql<t.ObjDiffOp>({ type: 'add', path: ['key'], value: 'value' });
      });

      it('overwrites existing values', () => {
        const target = { a: 1 };
        const op = Mutate.set(target, ['a'], 2);
        expect(target.a).to.eql(2);
        expect(op).to.eql<t.ObjDiffOp>({ type: 'update', path: ['a'], prev: 1, next: 2 });
      });

      it('creates nested objects automatically', () => {
        const target = {};
        const op = Mutate.set(target, ['a', 'b', 'c'], 'deep');
        expect((target as any).a.b.c).to.eql('deep');
        expect(op).to.eql<t.ObjDiffOp>({ type: 'add', path: ['a', 'b', 'c'], value: 'deep' });
      });

      it('creates nested arrays automatically when path segment is number', () => {
        const target: Record<string, unknown> = {};
        const op = Mutate.set(target, ['arr', 0, 'foo'], 'bar');
        expect(target.arr).to.be.an('array').with.lengthOf(1);
        expect((target as any).arr[0].foo).to.eql('bar');
        expect(op).to.eql<t.ObjDiffOp>({
          type: 'add',
          path: ['arr', 0, 'foo'],
          value: 'bar',
        });
      });

      it('<undefined> → property removed via [delete] rather than set <undefined>', () => {
        type T = { a: { b?: number | string } };
        const target: T = { a: {} };
        const path = ['a', 'b'] as const satisfies t.ObjectPath;

        const addOp = Mutate.set(target, path, 123);
        expect(target.a?.b).to.eql(123);
        expect(Object.keys(target.a).length).to.eql(1);
        expect(addOp).to.eql<t.ObjDiffOp>({ type: 'add', path, value: 123 });

        const removeOp = Mutate.set(target, path, undefined);
        expect(Object.keys(target.a).length).to.eql(0); // NB: deleted.
        expect(target.a).to.eql({});
        expect(removeOp).to.eql<t.ObjDiffOp>({ type: 'remove', path, prev: 123 });
      });

      it('returns <undefined> when setting a value equal to the existing value', () => {
        const subject = { foo: 'bar' };
        const result = Mutate.set(subject, ['foo'], 'bar');
        expect(result).to.eql(undefined);
      });

      it('returns <undefined> when setting <undefined> for a key that does not exist', () => {
        const subject = {};
        const result = Mutate.set(subject, ['baz'], undefined);
        expect(result).to.eql(undefined);
      });
    });

    describe('Mutate.ensure', () => {
      it('assigns default at top-level when missing', () => {
        const target: Record<string, unknown> = {};
        const value = 'my-value';
        const result = Mutate.ensure(target, ['key'], value);
        expect(target.key).to.eql(value);
        expect(result).to.eql(value);
      });

      it('does not override existing value', () => {
        const value = 'foo';
        const target = { key: value };
        const path = ['key'];

        Mutate.ensure(target, path, 123);
        expect(target.key).to.eql(value);

        Mutate.ensure(target, path, null);
        expect(target.key).to.eql(value);

        Mutate.ensure(target, path, undefined as any);
        expect(target.key).to.eql(value);
      });

      it('ensures null value', () => {
        const target = { foo: { bar: {} } };
        Mutate.ensure(target, ['foo', 'bar', 'value'], null);
        expect((target.foo.bar as any).value).to.eql(null);
      });

      it('creates nested objects automatically', () => {
        const target = {};
        Mutate.ensure(target, ['a', 'b', 'c'], 123);
        expect((target as any).a.b.c).to.eql(123);
      });

      it('creates nested namespace', () => {
        const target = {};
        const ns = {};
        const result = Mutate.ensure(target, ['a', 'b', 'c'], ns);
        expect((target as any).a.b.c).to.equal(ns);
        expect(result).to.equal(ns);
      });

      it('creates nested arrays automatically when path segment is number', () => {
        const target: Record<string, unknown> = {};
        Mutate.ensure(target, ['arr', 0, 'foo'], 'bar');
        expect(target.arr).to.be.an('array').with.lengthOf(1);
        expect((target as any).arr[0].foo).to.eql('bar');
      });
    });

    describe('Mutate.diff', () => {
      it('adds, updates, and deletes top-level keys', () => {
        const target: O = { a: 1, b: 2, c: 3 };
        const source: O = { b: 2, c: 99, d: 4 };
        const report = Mutate.diff(source, target);

        expect(target).to.eql(source);
        expect(report.stats).to.eql({
          adds: 1,
          removes: 1,
          updates: 1,
          arrays: 0,
          total: 3,
        });

        // Spot-check op kinds.
        expect(report.ops.map((o) => o.type).sort()).to.eql(['add', 'remove', 'update']);
      });

      it('handles nested objects recursively', () => {
        const target: O = { user: { name: 'Ann', age: 21, misc: 'remove-me' } };
        const source: O = { user: { name: 'Ann', age: 22 } };

        const report = Mutate.diff(source, target);

        expect(target).to.eql(source);
        expect(report.stats).to.eql({
          adds: 0,
          removes: 1,
          updates: 1,
          arrays: 0,
          total: 2,
        });

        const paths = report.ops.map((o) => o.path.join('.'));
        expect(paths).to.include('user.age').and.to.include('user.misc');
      });

      it('replaces arrays when they differ', () => {
        const target: O = { list: [1, 2, 3] };
        const source: O = { list: [1, 2, 4] };

        const report = Mutate.diff(source, target);

        expect(target).to.eql(source); // Values equal.
        expect(target.list).to.not.equal(source.list); // Cloned ref.

        expect(report.stats).to.eql({
          adds: 0,
          removes: 0,
          updates: 0,
          arrays: 1,
          total: 1,
        });
        expect(report.ops[0].type).to.eql('array');
        expect(report.ops[0].path).to.eql(['list']);
      });

      it('makes no changes when target already equals source', () => {
        const target: O = { x: { y: 1 } };
        const source: O = { x: { y: 1 } };

        const report = Mutate.diff(source, target);

        expect(report.stats.total).to.eql(0);
        expect(report.ops.length).to.eql(0);
        expect(target).to.eql(source);
      });

      it('handles self-referential cycles without blowing the stack', () => {
        const target: any = { label: 'A' };
        target.self = target; // ← cycle in target.

        const source: any = { label: 'B' };
        source.self = source; // ← cycle in source.

        const report = Mutate.diff(source, target);
        expect(report.stats).to.eql({
          adds: 0,
          removes: 0,
          updates: 1, // ← label.
          arrays: 0,
          total: 1,
        });
        expect(target.label).to.eql('B'); //     ← target mutated.
        expect(target.self).to.equal(target); // ← cycle preserved.
      });

      describe('diffArrays: true', () => {
        it('diffs arrays element-by-element when one value changes', () => {
          const target: O = { list: [1, 2, 3] };
          const source: O = { list: [1, 99, 3] };

          const report = Mutate.diff(source, target, { diffArrays: true });

          expect(target).to.eql(source); // ← target mutated to equal source.
          expect(report.stats).to.eql({
            adds: 0,
            removes: 0,
            updates: 1, // ← index 1 changed.
            arrays: 0, //  ← no wholesale replace.
            total: 1,
          });
          expect(report.ops[0]).to.eql<t.ObjDiffOp>({
            type: 'update',
            path: ['list', 1],
            prev: 2,
            next: 99,
          });
        });

        it('handles length changes (adds & removes) in one pass', () => {
          const target: O = { nums: [10, 20, 30] };
          const source: O = { nums: [10, 40] }; // 20 → 40, remove 30.

          const report = Mutate.diff(source, target, { diffArrays: true });

          expect(target).to.eql(source);
          expect(report.stats).to.eql({
            adds: 0,
            removes: 1, // index 2 deleted.
            updates: 1, // index 1 updated.
            arrays: 0,
            total: 2,
          });

          // Order-agnostic check of the two ops.
          const kinds = report.ops.map((o) => o.type).sort();
          expect(kinds).to.eql(['remove', 'update']);
        });
      });
    });

    describe('Mutate.delete', () => {
      it('delete top-level key and return a remove op', () => {
        const subject: Record<string, unknown> = { foo: 'bar', baz: 42 };
        const op = del(subject, ['foo']);
        expect(op).to.eql({ type: 'remove', path: ['foo'], prev: 'bar' });
        expect((subject as any).foo).to.be.undefined;
        expect(subject.baz).to.eql(42);
      });

      it('delete nested key and return a remove op', () => {
        const subject: Record<string, unknown> = { a: { b: { c: true } } };
        const op = del(subject, ['a', 'b', 'c']);
        expect(op).to.eql({ type: 'remove', path: ['a', 'b', 'c'], prev: true });
        expect((subject.a as Record<string, any>).b).to.not.have.property('c');
      });

      it('return <undefined> when path does not exist', () => {
        const subject: Record<string, unknown> = { a: { b: 1 } };
        const before = Obj.clone(subject);
        const op = del(subject, ['a', 'x']);
        expect(op).to.be.undefined;
        expect(subject).to.eql(before);
      });

      it('return <undefined> when path is empty', () => {
        const subject: Record<string, unknown> = { foo: 'bar' };
        const before = Obj.clone(subject);
        const op = del(subject, [] as t.ObjectPath);
        expect(op).to.be.undefined;
        expect(subject).to.eql(before);
      });

      it('delete array index and return a remove op', () => {
        const subject: Record<string, unknown> = { arr: [10, 20, 30] };
        const op = del(subject, ['arr', 1]);
        expect(op).to.eql({ type: 'remove', path: ['arr', 1], prev: 20 });
        expect(Array.isArray(subject.arr)).to.be.true;

        // NB: Delete leaves a hole in the array rather than shifting.
        expect((subject.arr as any)[1]).to.be.undefined;
        expect((subject.arr as any).length).to.eql(3);
        expect(subject.arr).to.eql([10, undefined, 30]);
      });
    });
  });

  describe('Path.Curried', () => {
    it('API', () => {
      expect(Path.curry).to.equal(CurriedPath.create);
    });

    describe('create: path.curry(...)', () => {
      it('path: foo/bar', () => {
        const path = ['foo', 'bar'];
        const a = CurriedPath.create(path);
        const b = Path.curry(path);
        expect(a.path).to.eql(path);
        expect(a.path).to.eql(b.path);
      });

      it('path: <empty>', () => {
        const test = (input: any) => {
          const res = Path.curry(input);
          expect(res.path).to.eql([]);
        };
        const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v: any) => test(v));
      });
    });

    describe('path.curry(...).get', () => {
      it('type overloads', () => {
        const subject = { foo: 123 };
        const p = Path.curry<number>(['foo']);
        const a = p.get(subject);
        const b = p.get(subject, 0);
        expectTypeOf(a).toEqualTypeOf<number | undefined>();
        expectTypeOf(b).toEqualTypeOf<number>();
      });

      it('retrieves a top-level value', () => {
        const p = Path.curry<number>(['foo']);
        const subject = { foo: 123 };
        expect(p.get(subject)).to.eql(123);
      });

      it('retrieves a nested value', () => {
        const p = Path.curry<string>(['a', 'b', 'c']);
        const subject = { a: { b: { c: 'hello' } } };
        expect(p.get(subject)).to.eql('hello');
      });

      it('returns <undefined> when the path is missing', () => {
        const p = Path.curry<number>(['missing']);
        const subject = { other: 42 };
        expect(p.get(subject)).to.be.undefined;
      });

      it('returns <undefined> when an intermediate key is absent', () => {
        const p = Path.curry(['a', 'b']);
        const subject = { a: {} };
        expect(p.get(subject)).to.be.undefined;
      });

      it('returns the subject itself for an empty path', () => {
        const p = Path.curry([]);
        const subject = { anything: true };
        expect(p.get(subject)).to.eql(subject);
      });

      it('returns the default value when provided and path is missing', () => {
        const p = Path.curry(['doesNotExist']);
        const subject = { foo: 'bar' };
        const defaultValue = 'fallback';
        expect(p.get(subject, defaultValue)).to.eql(defaultValue);
      });

      it('returns the default value when subject is <null> or <undefined>', () => {
        const p = Path.curry(['any']);
        const defaultValue = 0;
        expect(p.get(null as any, defaultValue)).to.eql(defaultValue);
        expect(p.get(undefined as any, defaultValue)).to.eql(defaultValue);
      });

      it('subject is <undefined>', () => {
        const p = Path.curry(['a', 'b']);
        expect(p.get(undefined)).to.eql(undefined);
        expect(p.get(undefined, 'foo')).to.eql('foo');
      });
    });

    describe('Path.curry(...).exists', () => {
      const p = Path.curry(['foo']);

      it('returns true when the property is present (any value)', () => {
        const subject1 = { foo: 123 };
        const subject2 = { foo: undefined };

        expect(p.exists(subject1)).to.be.true; // ← value present.
        expect(p.exists(subject2)).to.be.true; // ← present but undefined.
      });

      it('returns false when the property is absent', () => {
        const subject = { bar: 1 };
        expect(p.exists(subject)).to.be.false;
      });

      it('returns false when the subject itself is undefined', () => {
        expect(p.exists(undefined)).to.be.false;
      });
    });

    describe('path.curry(...).set', () => {
      const p = Path.curry<number | undefined>(['foo']);

      it('sets a new value at the curried key', () => {
        const subject: Record<string, unknown> = {};
        const op = p.set(subject, 123);

        expect(subject.foo).to.eql(123);
        expect(op).to.eql<t.ObjDiffOp>({
          type: 'add',
          path: ['foo'],
          value: 123,
        });
      });

      it('overwrites an existing value', () => {
        const subject = { foo: 1 };
        const op = p.set(subject, 2);

        expect(subject.foo).to.eql(2);
        expect(op).to.eql<t.ObjDiffOp>({
          type: 'update',
          path: ['foo'],
          prev: 1,
          next: 2,
        });
      });

      it('returns <undefined> when value is unchanged', () => {
        const subject = { foo: 42 };
        const op = p.set(subject, 42);
        expect(op).to.be.undefined;
      });

      it('removes the property when value is <undefined>', () => {
        const subject = { foo: 99 };
        const op = p.set(subject, undefined);

        expect('foo' in subject).to.be.false;
        expect(op).to.eql<t.ObjDiffOp>({
          type: 'remove',
          path: ['foo'],
          prev: 99,
        });
      });
    });

    describe('path.curry(...).ensure', () => {
      const p = Path.curry<number>(['foo']);

      it('leaves an existing value untouched', () => {
        const subject = { foo: 10 };
        const result = p.ensure(subject, 999);

        expect(result).to.eql(10); //      ← returns existing.
        expect(subject.foo).to.eql(10); // ← no mutation.
      });

      it('sets and returns the default when value is missing', () => {
        const subject: Record<string, unknown> = {};
        const result = p.ensure(subject, 42);

        expect(result).to.eql(42); //      ← returns default.
        expect(subject.foo).to.eql(42); // ← property now exists.
      });
    });

    describe('path.curry(...).delete', () => {
      const p = Path.curry<number>(['foo']);

      it('removes an existing property and returns the remove-op', () => {
        const subject = { foo: 7 };

        const op = p.delete(subject);

        expect('foo' in subject).to.be.false;
        expect(op).to.eql<t.ObjDiffOp>({
          type: 'remove',
          path: ['foo'],
          prev: 7,
        });
      });

      it('returns <undefined> when the property is already absent', () => {
        const subject: Record<string, unknown> = {};

        const op = p.delete(subject);

        expect(op).to.be.undefined;
        expect(subject).to.eql({}); // no mutation
      });
    });

    describe('path.curry(...).join(...)', () => {
      it('joins a sub-path', () => {
        const a = Path.curry<number>(['foo']);
        expect(a.path).to.eql(['foo']);

        const b = a.join(['bar', 'zoo']);
        expect(b.path).to.eql(['foo', 'bar', 'zoo']);
      });

      it('empty sub-path', () => {
        const a = Path.curry<number>(['foo']);
        const b = a.join([]);
        expect(a.path).to.eql(b.path);
        expect(a).to.not.equal(b); // NB: different instance.
      });
    });
  });

  describe('Path.Codec', () => {
    describe('defaults', () => {
      it('exposes codecs and sets pointer as default', () => {
        expect(Codec.pointer.kind).to.eql('pointer');
        expect(Codec.dot.kind).to.eql('dot');
        // default is pointer (by identity or by name)
        expect(Codec.default).to.equal(Codec.pointer);
        expect(Codec.default.kind).to.eql('pointer');
      });
    });

    describe('pointer (RFC 6901)', () => {
      it('encode: root → empty string', () => {
        expect(Codec.pointer.encode([])).to.eql('');
      });

      it('decode: empty string → root', () => {
        expect(Codec.pointer.decode('')).to.eql([]);
      });

      it('encode/decode: simple path', () => {
        const path = ['foo', 'bar', 0] as const;
        const text = Codec.pointer.encode(path as unknown as (string | number)[]);
        expect(text).to.eql('/foo/bar/0');
        expect(Codec.pointer.decode(text)).to.eql(['foo', 'bar', '0']); // ← strings
      });

      it('escape round-trip: "/" and "~" inside keys', () => {
        const path = ['a/b', 'c~d'];
        const text = Codec.pointer.encode(path);
        expect(text).to.eql('/a~1b/c~0d');
        expect(Codec.pointer.decode(text)).to.eql(['a/b', 'c~d']);
      });

      it('numeric tokens are returned as strings', () => {
        expect(Codec.pointer.decode('/arr/0')).to.eql(['arr', '0']); // ← strings
        expect(Codec.pointer.decode('/10/2')).to.eql(['10', '2']); // ← strings
      });

      it('rejects invalid non-root text not starting with "/"', () => {
        expect(() => Codec.pointer.decode('foo/bar')).to.throw(
          'Invalid JSON Pointer: must start with "/" or be "".',
        );
      });
    });

    describe('dot (developer-friendly)', () => {
      it('encode: root → empty string', () => {
        expect(Codec.dot.encode([])).to.eql('');
      });

      it('decode: empty string → root', () => {
        expect(Codec.dot.decode('')).to.eql([]);
      });

      it('encode/decode: identifiers + array indices', () => {
        const path = ['foo', 'bar', 0, 'baz', 10];
        const text = Codec.dot.encode(path);
        // identifiers join with dots; numbers become bracket indices
        expect(text).to.eql('foo.bar[0].baz[10]');
        expect(Codec.dot.decode(text)).to.eql(['foo', 'bar', 0, 'baz', 10]);
      });

      it('escape round-trip: ".", "[", "]", and "\\" inside keys', () => {
        const path = ['a.b', 'c[d]', 'e\\f', 'g]h[', 'plain'];
        const text = Codec.dot.encode(path);
        expect(text).to.eql('a\\.b.c\\[d\\].e\\\\f.g\\]h\\[.plain');
        expect(Codec.dot.decode(text)).to.eql(['a.b', 'c[d]', 'e\\f', 'g]h[', 'plain']);
      });

      it('numeric-looking bare identifiers remain strings; bracket numbers become indices', () => {
        // Bare token "0" stays a string key:
        expect(Codec.dot.decode('root.0')).to.eql(['root', '0']);
        // Bracket form turns into numbers:
        expect(Codec.dot.decode('root[0][10]')).to.eql(['root', 0, 10]);
      });

      it('errors on unclosed bracket', () => {
        expect(() => Codec.dot.decode('foo[0')).to.throw('Unclosed bracket in path.');
      });

      it('errors on dangling escape', () => {
        expect(() => Codec.dot.decode('foo\\')).to.throw('Invalid escape at end of path.'); // ← fixed
      });
    });

    describe('parity & round-trip across codecs', () => {
      const cases: (string | number)[][] = [
        [],
        ['foo'],
        ['foo', 0, 'bar'],
        ['a/b', 'c~d', 10, 'x.y', 'z[w]'],
        ['\\', '.', '[', ']', '0', '01'], // tricky keys
      ];

      it('pointer: path → encode → decode → same path', () => {
        for (const path of cases) {
          const text = Codec.pointer.encode(path);
          const back = Codec.pointer.decode(text); // strings only
          const asStrings = path.map((k) => String(k)); // preserve '01' vs '1'
          expect(back).to.eql(asStrings);
        }
      });

      it('dot: path → encode → decode → same path', () => {
        for (const path of cases) {
          const text = Codec.dot.encode(path);
          const back = Codec.dot.decode(text);
          expect(back).to.eql(path);
        }
      });

      it('interchange: encode with pointer, decode with pointer (lossless chars, not types)', () => {
        const path = ['a/b', 'c~d', 0, 'x.y', 'z[w]'];
        const text = Codec.pointer.encode(path);
        const back = Codec.pointer.decode(text); // string[]
        const asStrings = path.map((k) => String(k)); // preserve '01' vs '1'
        expect(back).to.eql(asStrings);
      });
    });

    describe('print', () => {
      const printCodec = (codec: t.ObjectPathCodec, example: (string | number)[]) => {
        console.info(Str.SPACE);
        console.info(c.cyan(`Obj.Path.Codec.${c.bold(codec.kind)}:`));
        console.info(codec);
        console.info(c.gray('\nExample:'));
        console.info(c.cyan(`ƒ encode( [path] ):`), codec.encode(example));
        console.info(c.cyan(`ƒ decode( "path" ):`), codec.decode(codec.encode(example)));
        console.info(Str.SPACE);
      };

      it('pointer', () => {
        printCodec(Codec.pointer, ['a/b', 'c~d', 0, 'x.y', 'z[w]']);
      });

      it('dot', () => {
        printCodec(Codec.dot, ['a.b', 'c[d]', 'e\\f', 'g]h[', 'plain', 0, 10]);
      });
    });
  });
});
