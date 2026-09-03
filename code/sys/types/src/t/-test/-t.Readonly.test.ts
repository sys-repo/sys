import { describe, it } from '../../-test.ts';
import type { t } from '../common.ts';

declare const ARRAY_BRAND: unique symbol;

describe('Types: Readonly', () => {
  describe('DeepReadonly<T>', () => {
    it('makes nested fields readonly', () => {
      type T = { foo: number; child: { bar: number } };
      type TReadOnly = t.DeepReadonly<T>;
      const obj: TReadOnly = { foo: 0, child: { bar: 0 } };

      // @ts-expect-error deep readonly fields cannot be assigned.
      obj.foo = 123;

      // @ts-expect-error nested deep readonly fields cannot be assigned.
      obj.child.bar = 456;
    });

    it('preserves mutable and readonly array structure', () => {
      type _ = [
        t.Type.Assert<
          t.Type.Equal<
            t.DeepReadonly<Array<{ value: number[] }>>,
            ReadonlyArray<{ readonly value: readonly number[] }>
          >
        >,
        t.Type.Assert<
          t.Type.Equal<
            t.DeepReadonly<readonly { value: string[] }[]>,
            readonly { readonly value: readonly string[] }[]
          >
        >,
      ];
    });

    it('preserves mutable and readonly tuple positions', () => {
      type Mutable = [{ value: 1 }, ['a', 'b']];
      type Readonly = readonly [{ value: 1 }, readonly ['a', 'b']];
      type Expected = readonly [{ readonly value: 1 }, readonly ['a', 'b']];

      type _ = [
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<[]>, readonly []>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<readonly []>, readonly []>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<Mutable>, Expected>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<Readonly>, Expected>>,
      ];
    });

    it('preserves optional and rest tuple elements', () => {
      type Input = [
        head: { value: 1 },
        tail?: { value: 2 },
        ...rest: { value: 3 }[],
      ];
      type ReadonlyInput = readonly [
        head: { value: 1 },
        tail?: { value: 2 },
        ...rest: { value: 3 }[],
      ];
      type Expected = readonly [
        head: { readonly value: 1 },
        tail?: { readonly value: 2 },
        ...rest: { readonly value: 3 }[],
      ];
      type LeadingRest = [...prefix: string[], tail: { value: 4 }];
      type ReadonlyLeadingRest = readonly [...prefix: string[], tail: { value: 4 }];
      type ExpectedLeadingRest = readonly [...prefix: string[], tail: { readonly value: 4 }];
      type Homogeneous = [
        head?: string | undefined,
        ...tail: (string | undefined)[],
      ];
      type ReadonlyHomogeneous = readonly [
        head?: string | undefined,
        ...tail: (string | undefined)[],
      ];

      type TupleOrArray = [value: { tuple: number[] }] | Array<{ array: string[] }>;
      type ExpectedTupleOrArray =
        | readonly [value: { readonly tuple: readonly number[] }]
        | ReadonlyArray<{ readonly array: readonly string[] }>;

      type _ = [
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<Input>, Expected>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<ReadonlyInput>, Expected>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<LeadingRest>, ExpectedLeadingRest>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<ReadonlyLeadingRest>, ExpectedLeadingRest>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<Homogeneous>, ReadonlyHomogeneous>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<ReadonlyHomogeneous>, ReadonlyHomogeneous>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<TupleOrArray>, ExpectedTupleOrArray>>,
      ];
    });

    it('projects decorated array containers to their canonical readonly surface', () => {
      type Element = { value: number[] };
      type Sentinel = Element & { meta: { labels: string[] } };
      type DecoratedArray = Element[] & {
        tag: 'open';
        optional?: { values: number[] };
        [-1]: Sentinel;
      };
      type ReadonlyDecoratedArray = readonly Element[] & { readonly tag: 'readonly' };
      type MutableDecoratedTuple = [head: Element] & { meta: { values: number[] } };
      type ReadonlyDecoratedTuple = readonly [head: Element] & {
        meta: { values: number[] };
      };
      type DecoratedEmptyTuple = [] & { tag: 'empty' };
      type ReadonlyDecoratedEmptyTuple = readonly [] & { readonly tag: 'empty' };
      type DecoratedHomogeneousTuple = [
        head?: Element,
        ...tail: (Element | undefined)[],
      ] & { tag: 'homogeneous' };
      type DecoratedVariadicTuple = [head: Element, ...tail: string[]] & {
        tag: 'variadic';
      };
      type DecoratedLeadingRestTuple = [...prefix: string[], tail: Element] & {
        tag: 'leading-rest';
      };
      type NegativeNumericTuple = [head: Element] & { [-1]: Sentinel };
      type FractionalNumericTuple = [head: Element] & { [0.5]: Sentinel };
      type ExistingPositionTuple = [head: Element] & { [0]: Sentinel };
      type PositiveNumericTuple = [head: Element] & { [2]: Sentinel };
      type PositiveStringTuple = [head: Element] & { '2': Sentinel };
      type SymbolDecoratedTuple = [head: Element] & { [ARRAY_BRAND]: 'tuple' };
      type LengthRefinedTuple = [head: Element] & { length: 1 };
      type MethodRefinedTuple = [head: Element] & {
        forEach: { meta: { values: number[] } };
      };
      interface RecursiveDecoratedArray extends Array<RecursiveDecoratedArray> {
        meta: { values: number[] };
      }
      interface ReadonlyRecursiveDecoratedArray
        extends ReadonlyArray<ReadonlyRecursiveDecoratedArray> {
        readonly meta: { readonly values: readonly number[] };
      }
      type ExpectedElement = { readonly value: readonly number[] };
      type ExpectedArray = ReadonlyArray<ExpectedElement>;
      type ArrayOutput = t.DeepReadonly<DecoratedArray>;
      type RecursiveOutput = t.DeepReadonly<RecursiveDecoratedArray>;
      type ReadonlyRecursiveOutput = t.DeepReadonly<ReadonlyRecursiveDecoratedArray>;

      type _ = [
        t.Type.Assert<t.Type.Equal<ArrayOutput, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<ReadonlyDecoratedArray>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<MutableDecoratedTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<ReadonlyDecoratedTuple>, ExpectedArray>>,
        t.Type.Assert<
          t.Type.Equal<t.DeepReadonly<DecoratedEmptyTuple>, ReadonlyArray<never>>
        >,
        t.Type.Assert<
          t.Type.Equal<t.DeepReadonly<ReadonlyDecoratedEmptyTuple>, ReadonlyArray<never>>
        >,
        t.Type.Assert<
          t.Type.Equal<
            t.DeepReadonly<DecoratedHomogeneousTuple>,
            ReadonlyArray<ExpectedElement | undefined>
          >
        >,
        t.Type.Assert<
          t.Type.Equal<
            t.DeepReadonly<DecoratedVariadicTuple>,
            ReadonlyArray<string | ExpectedElement>
          >
        >,
        t.Type.Assert<
          t.Type.Equal<
            t.DeepReadonly<DecoratedLeadingRestTuple>,
            ReadonlyArray<string | ExpectedElement>
          >
        >,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<NegativeNumericTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<FractionalNumericTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<ExistingPositionTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<PositiveNumericTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<PositiveStringTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<SymbolDecoratedTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<LengthRefinedTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<MethodRefinedTuple>, ExpectedArray>>,
        t.Type.Assert<t.Type.Equal<RecursiveOutput[number], RecursiveOutput>>,
        t.Type.Assert<t.Type.Equal<ReadonlyRecursiveOutput[number], ReadonlyRecursiveOutput>>,
        t.Type.Assert<t.Type.Equal<'meta' extends keyof RecursiveOutput ? true : false, false>>,
        t.Type.Assert<
          t.Type.Equal<'meta' extends keyof ReadonlyRecursiveOutput ? true : false, false>
        >,
        t.Type.Assert<
          t.Type.Equal<
            Extract<'push' | 'pop' | 'splice' | 'reverse' | 'sort', keyof ArrayOutput>,
            never
          >
        >,
      ];

      const read = (value: ArrayOutput) =>
        value.forEach((item) => {
          type _ = t.Type.Assert<t.Type.Equal<typeof item, ExpectedElement>>;
        });
      void read;
    });

    it('preserves distributed decorated projections without requiring union normalization', () => {
      type Element = { value: number[] };
      type Input = (Element[] & { tag: 'a' }) | (Element[] & { meta: 'b' });
      type ExpectedElement = { readonly value: readonly number[] };
      type Expected = ReadonlyArray<ExpectedElement>;
      type Output = t.DeepReadonly<Input>;

      type _ = [
        t.Type.Assert<t.Type.NotEqual<Output, any>>,
        t.Type.Assert<t.Type.Extends<Output, Expected>>,
        t.Type.Assert<t.Type.Extends<Expected, Output>>,
        t.Type.Assert<
          t.Type.Equal<
            Extract<
              'tag' | 'meta' | 'push' | 'pop' | 'splice' | 'reverse' | 'sort',
              keyof Output
            >,
            never
          >
        >,
      ];

      const read = (value: Output) =>
        value.forEach((item) => {
          type _ = t.Type.Assert<t.Type.Equal<typeof item, ExpectedElement>>;
        });
      void read;
    });

    it('supports recursive JSON and tuple-array structures', () => {
      type Json = t.DeepReadonly<t.Json>;
      type JsonMap = t.DeepReadonly<t.JsonMap>;
      type JsonLike = t.DeepReadonly<t.JsonLike>;
      type JsonMapLike = t.DeepReadonly<t.JsonMapLike>;
      type JsonU = t.DeepReadonly<t.JsonU>;
      type JsonMapU = t.DeepReadonly<t.JsonMapU>;
      type JsonLikeU = t.DeepReadonly<t.JsonLikeU>;
      type JsonMapLikeU = t.DeepReadonly<t.JsonMapLikeU>;
      type CBOR = t.DeepReadonly<t.CBOR>;
      type RecursiveOutputs =
        | Json
        | JsonMap
        | JsonLike
        | JsonMapLike
        | JsonU
        | JsonMapU
        | JsonLikeU
        | JsonMapLikeU
        | CBOR;
      type CBORMap = Exclude<Extract<CBOR, object>, readonly unknown[]>;
      type Tree = [value: string, children: Tree[]];
      type ReadonlyTree = readonly [value: string, children: readonly ReadonlyTree[]];
      interface MutableRecursiveArray extends Array<MutableRecursiveArray> {}
      interface ReadonlyRecursiveArray extends ReadonlyArray<ReadonlyRecursiveArray> {}
      type MutableRecursiveOutput = t.DeepReadonly<MutableRecursiveArray>;
      type ReadonlyRecursiveOutput = t.DeepReadonly<ReadonlyRecursiveArray>;

      type _ = [
        t.Type.Assert<t.Type.NotEqual<RecursiveOutputs, any>>,
        t.Type.Assert<t.Type.NotEqual<Json, never>>,
        t.Type.Assert<t.Type.NotEqual<JsonMap, never>>,
        t.Type.Assert<t.Type.NotEqual<JsonLike, never>>,
        t.Type.Assert<t.Type.NotEqual<JsonMapLike, never>>,
        t.Type.Assert<t.Type.NotEqual<JsonU, never>>,
        t.Type.Assert<t.Type.NotEqual<JsonMapU, never>>,
        t.Type.Assert<t.Type.NotEqual<JsonLikeU, never>>,
        t.Type.Assert<t.Type.NotEqual<JsonMapLikeU, never>>,
        t.Type.Assert<t.Type.NotEqual<CBOR, never>>,
        t.Type.Assert<t.Type.Equal<JsonMap[string], Json>>,
        t.Type.Assert<t.Type.Equal<JsonMapLike[string], JsonLike>>,
        t.Type.Assert<t.Type.Equal<JsonMapU[string], JsonU>>,
        t.Type.Assert<t.Type.Equal<JsonMapLikeU[string], JsonLikeU>>,
        t.Type.Assert<t.Type.Equal<Extract<Json, readonly unknown[]>[number], Json>>,
        t.Type.Assert<t.Type.Equal<Extract<JsonLike, readonly unknown[]>[number], JsonLike>>,
        t.Type.Assert<t.Type.Equal<Extract<JsonU, readonly unknown[]>[number], JsonU>>,
        t.Type.Assert<t.Type.Equal<Extract<JsonLikeU, readonly unknown[]>[number], JsonLikeU>>,
        t.Type.Assert<t.Type.Equal<CBORMap[string], CBOR>>,
        t.Type.Assert<t.Type.Equal<Extract<CBOR, readonly unknown[]>[number], CBOR>>,
        t.Type.Assert<t.Type.Equal<t.DeepReadonly<Tree>, ReadonlyTree>>,
        t.Type.Assert<t.Type.Equal<MutableRecursiveOutput[number], MutableRecursiveOutput>>,
        t.Type.Assert<t.Type.Equal<ReadonlyRecursiveOutput[number], ReadonlyRecursiveOutput>>,
        t.Type.Assert<
          t.Type.Equal<'push' extends keyof MutableRecursiveOutput ? true : false, false>
        >,
        t.Type.Assert<
          t.Type.Equal<'push' extends keyof ReadonlyRecursiveOutput ? true : false, false>
        >,
      ];

      const mutateMap = (value: JsonMap) => {
        // @ts-expect-error recursive map fields are readonly.
        value.next = null;
      };
      const mutateArray = (value: Extract<Json, readonly unknown[]>) => {
        // @ts-expect-error recursive arrays have no mutable methods.
        value.push(null);
      };
      void mutateMap;
      void mutateArray;
    });

    it('retains the DistPkg consumer shape', () => {
      type Output = t.DeepReadonly<t.DistPkg>;
      type Ignore = NonNullable<Output['build']['hash']['ignore']>;

      type _ = [
        t.Type.Assert<t.Type.NotEqual<Output, never>>,
        t.Type.Assert<t.Type.Extends<t.DistPkg, Output>>,
        t.Type.Assert<t.Type.Equal<Ignore['rules'], readonly string[]>>,
        t.Type.Assert<
          t.Type.Extends<
            Output,
            {
              readonly build: {
                readonly hash: {
                  readonly ignore?: { readonly rules: readonly string[] };
                };
              };
            }
          >
        >,
      ];
    });
  });

  describe('Mutable<T> | DeepMutable<T>', () => {
    it('makes nested fields mutable with DeepMutable<T>', () => {
      type T = { readonly foo: number; readonly child: { readonly bar: number } };
      type TMutable = t.DeepMutable<T>;

      const obj: TMutable = { foo: 0, child: { bar: 0 } };
      obj.foo = 123;
      obj.child = { bar: 123 };
      obj.child.bar = 456;
    });

    it('makes only top-level fields mutable with Mutable<T>', () => {
      type T = { readonly foo: number; readonly child: { readonly bar: number } };
      type TMutable = t.Mutable<T>;

      const obj: TMutable = { foo: 0, child: { bar: 0 } };

      // Top-level becomes writable:
      obj.foo = 123;
      obj.child = { bar: 123 };

      // Nested remains readonly (compile-time):
      // @ts-expect-error - shallow Mutable does not remove nested readonly
      obj.child.bar = 456;

      // Also verify type-level intent:
      type _ = [
        t.Type.Assert<t.Type.Equal<TMutable['foo'], number>>,
        t.Type.Assert<t.Type.Extends<TMutable, { foo: number; child: { readonly bar: number } }>>,
      ];
    });
  });
});
