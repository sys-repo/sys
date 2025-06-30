import { describe, expect, expectTypeOf, it } from '../-test.ts';
import { Mutate } from '../m.ObjectPath/m.Mutate.ts';
import { Value } from '../m.Value/mod.ts';
import { Obj } from './m.Obj.ts';
import { Path } from './mod.ts';

describe('Value.Obj.Path', () => {
  it('API', () => {
    expect(Obj.Path).to.equal(Path);
    expect(Value.Obj.Path).to.equal(Path);
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
      expect(value).to.equal('found');

      // Type is string | undefined (no default):
      expectTypeOf(value).toEqualTypeOf<string | undefined>();
    });

    it('returns undefined when the path is missing', () => {
      const value = Obj.Path.get<number>(sample, ['foo', 'bar', 99, 'nope']);
      expect(value).to.be.undefined;
      expectTypeOf(value).toEqualTypeOf<number | undefined>();
    });

    it('returns the provided default when the path is missing', () => {
      const value = Obj.Path.get<string>(sample, ['foo', 'bar', 99, 'nope'], 'my-default');
      expect(value).to.equal('my-default');

      // Default supplied → never undefined:
      expectTypeOf(value).toEqualTypeOf<string>();
    });

    it('short-circuits when an intermediate segment is null/undefined', () => {
      const value = Obj.Path.get<string>(sample, ['foo', 'empty', 'x'], 'fallback');
      expect(value).to.equal('fallback');
      expectTypeOf(value).toEqualTypeOf<string>();
    });
  });

  describe('Path.Mutate', () => {
    const Mutate = Obj.Path.Mutate;

    describe('Mutate.set', () => {
      it('throws an error when path is empty', () => {
        const target = {};
        const fn = () => Mutate.set(target, [], 1);
        expect(fn).to.throw(/The path-array must contain at least one segment/);
      });

      it('sets a value at a top-level key', () => {
        const target: Record<string, unknown> = {};
        Mutate.set(target, ['key'], 'value');
        expect(target.key).to.eql('value');
      });

      it('overwrites existing values', () => {
        const target = { a: 1 };
        Mutate.set(target, ['a'], 2);
        expect(target.a).to.eql(2);
      });

      it('creates nested objects automatically', () => {
        const target = {};
        Mutate.set(target, ['a', 'b', 'c'], 'deep');
        expect((target as any).a.b.c).to.eql('deep');
      });

      it('creates nested arrays automatically when path segment is number', () => {
        const target: Record<string, unknown> = {};
        Mutate.set(target, ['arr', 0, 'foo'], 'bar');
        expect(target.arr).to.be.an('array').with.lengthOf(1);
        expect((target as any).arr[0].foo).to.eql('bar');
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
  });
});
