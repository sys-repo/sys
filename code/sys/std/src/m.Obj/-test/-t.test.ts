import { describe, expectTypeOf, it, type t } from '../../-test.ts';
import { Obj } from '../mod.ts';

const valueOfType = <T>() => undefined as unknown as T;

describe('Obj: types', () => {
  type O = Record<string, unknown>;
  type S = { count: number };

  it('exposes the nested Lib aliases', () => {
    expectTypeOf(Obj).toEqualTypeOf<t.Obj.Lib>();
    expectTypeOf(Obj.Path).toEqualTypeOf<t.Obj.Path.Lib>();
    expectTypeOf(Obj.Path.Is).toEqualTypeOf<t.Obj.Path.Is.Lib>();
    expectTypeOf(Obj.Path.Rel).toEqualTypeOf<t.Obj.Path.Rel.Lib>();
    expectTypeOf(Obj.Path.Codec).toEqualTypeOf<t.Obj.Path.Codec.Lib>();
    expectTypeOf(Obj.Path.curry).toEqualTypeOf<t.Obj.Path.Curried.Lib['make']>();
    expectTypeOf(Obj.Path.Mutate).toEqualTypeOf<t.Obj.Path.Mutate.Lib>();
    expectTypeOf(Obj.Lens).toEqualTypeOf<t.Obj.Lens.Lib>();
    expectTypeOf(Obj.Lens.Is).toEqualTypeOf<t.Obj.Lens.Is.Lib>();
  });

  it('exposes the nested Lens namespace', () => {
    type RW = t.Obj.Lens.Ref<S, number>;
    type RO = t.Obj.Lens.ReadonlyRef<S, number>;

    expectTypeOf(valueOfType<t.Obj.Lens.Unbound<number>>()).toMatchTypeOf<{
      readonly path: t.ObjectPath;
      bind(subject: S): RW;
    }>();
    expectTypeOf(valueOfType<RW>()).toMatchTypeOf<{
      readonly subject: S;
      readonly path: t.ObjectPath;
      get(): number | undefined;
      set(value: number): t.Obj.Path.Mutate.Op | undefined;
    }>();
    expectTypeOf(valueOfType<t.Obj.Lens.ReadonlyUnbound<number>>()).toMatchTypeOf<{
      readonly path: t.ObjectPath;
      bind(subject: S): RO;
    }>();
    expectTypeOf(valueOfType<RO>()).toMatchTypeOf<{
      readonly subject: S;
      readonly path: t.ObjectPath;
      get(): number | undefined;
      exists(): boolean;
    }>();
    expectTypeOf(valueOfType<t.Obj.Lens.ToObjectOptions>()).toMatchTypeOf<{
      depth?: number;
      includeGetters?: boolean;
    }>();
    expectTypeOf(valueOfType<t.Obj.Lens.Unwrap<{ lens: RW }>>()).toEqualTypeOf<{
      readonly lens: number;
    }>();
  });

  it('exposes the nested Path namespace', () => {
    expectTypeOf(valueOfType<t.Obj.Path.Fix>()).toEqualTypeOf<
      | 'trimmed'
      | 'ensured-leading-slash'
      | 'collapsed-multiple-slashes'
      | 'removed-trailing-slash'
    >();
    expectTypeOf(valueOfType<t.Obj.Path.SanitizeOptions>()).toMatchTypeOf<{
      codec?: t.Obj.Path.Codec.Kind | t.Obj.Path.Codec.Definition;
    }>();
    expectTypeOf(valueOfType<t.Obj.Path.TryDecodeOptions>()).toMatchTypeOf<
      t.Obj.Path.Codec.DecodeOptions & { fallback?: t.ObjectPath }
    >();
    expectTypeOf(valueOfType<t.Obj.Path.TryDecodeResult>()).toMatchTypeOf<
      | { readonly ok: true; readonly path: t.ObjectPath; readonly fixes: t.Obj.Path.Fix[] }
      | {
        readonly ok: false;
        readonly path: t.ObjectPath;
        readonly fixes: t.Obj.Path.Fix[];
        readonly error: Error;
      }
    >();
    expectTypeOf(valueOfType<t.Obj.Path.Codec.Definition>()).toMatchTypeOf<{
      readonly kind: t.Obj.Path.Codec.Kind | (string & {});
      encode(path: t.ObjectPath): string;
      decode(text: string): t.ObjectPath;
    }>();
    expectTypeOf(valueOfType<t.Obj.Path.Codec.Kind>()).toEqualTypeOf<'pointer' | 'dot'>();
    expectTypeOf(valueOfType<t.Obj.Path.Codec.EncodeOptions>()).toMatchTypeOf<{
      codec?: t.Obj.Path.Codec.Kind | t.Obj.Path.Codec.Definition;
    }>();
    expectTypeOf(valueOfType<t.Obj.Path.Codec.DecodeOptions>()).toMatchTypeOf<{
      codec?: t.Obj.Path.Codec.Kind | t.Obj.Path.Codec.Definition;
      numeric?: boolean;
      safe?: boolean;
    }>();
    expectTypeOf(valueOfType<t.Obj.Path.Curried.Instance<number>>()).toMatchTypeOf<{
      readonly path: t.ObjectPath;
      get(subject: O | undefined): number | undefined;
    }>();
    expectTypeOf(valueOfType<t.Obj.Path.Mutate.Op>()).toMatchTypeOf<
      | { type: 'add'; path: t.ObjectPath; value: unknown }
      | { type: 'remove'; path: t.ObjectPath; prev: unknown }
      | { type: 'update'; path: t.ObjectPath; prev: unknown; next: unknown }
      | { type: 'array'; path: t.ObjectPath; prev: unknown[]; next: unknown[] }
    >();
    expectTypeOf(valueOfType<t.Obj.Path.Mutate.Options>()).toMatchTypeOf<{
      diffArrays?: boolean;
    }>();
    expectTypeOf(valueOfType<t.Obj.Path.Mutate.Report>()).toMatchTypeOf<{
      readonly ops: t.Obj.Path.Mutate.Op[];
      readonly stats: {
        readonly adds: number;
        readonly removes: number;
        readonly updates: number;
        readonly arrays: number;
        readonly total: number;
      };
    }>();
    expectTypeOf(valueOfType<t.Obj.Path.Rel.Relation>()).toEqualTypeOf<
      'equal' | 'ancestor' | 'descendant' | 'disjoint'
    >();
  });
});
