import { describe, expect, expectTypeOf, it } from '../-test.ts';
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

  describe('Obj.Path.mutate', () => {
    it('throws an error when path is empty', () => {
      const target: Record<string, unknown> = {};
      const fn = () => Obj.Path.mutate(target, [], 1);
      expect(fn).to.throw(/The path-array must contain at least one segment/);
    });

    it('sets a value at a top-level key', () => {
      const target: Record<string, unknown> = {};
      Obj.Path.mutate(target, ['key'], 'value');
      expect(target.key).to.eql('value');
    });

    it('overwrites existing values', () => {
      const target: Record<string, unknown> = { a: 1 };
      Obj.Path.mutate(target, ['a'], 2);
      expect(target.a).to.eql(2);
    });

    it('creates nested objects automatically', () => {
      const target: Record<string, unknown> = {};
      Obj.Path.mutate(target, ['a', 'b', 'c'], 'deep');
      expect((target as any).a.b.c).to.eql('deep');
    });

    it('creates nested arrays automatically when path segment is number', () => {
      const target: Record<string, unknown> = {};
      Obj.Path.mutate(target, ['arr', 0, 'foo'], 'bar');
      expect(target.arr).to.be.an('array').with.lengthOf(1);
      expect((target as any).arr[0].foo).to.eql('bar');
    });
  });
});
