import { describe, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types: {object}', () => {
  describe('IsPlainObject<T>', () => {
    const v: any = undefined; // dummy runtime value for type assertions

    it('primitives -> false', () => {
      expectTypeOf<t.IsPlainObject<string>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<number>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<boolean>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<bigint>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<symbol>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<null>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<undefined>>(v).toEqualTypeOf<false>();
    });

    it('functions -> false', () => {
      type F = () => void;
      expectTypeOf<t.IsPlainObject<F>>(v).toEqualTypeOf<false>();
    });

    it('arrays and tuples -> false', () => {
      expectTypeOf<t.IsPlainObject<string[]>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<readonly number[]>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<[number, string]>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<readonly [number]>>(v).toEqualTypeOf<false>();
    });

    it('well-known objects -> false', () => {
      expectTypeOf<t.IsPlainObject<Date>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<RegExp>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<Map<string, number>>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<Set<number>>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<WeakMap<object, any>>>(v).toEqualTypeOf<false>();
      expectTypeOf<t.IsPlainObject<WeakSet<object>>>(v).toEqualTypeOf<false>();
    });

    it('plain objects -> true', () => {
      expectTypeOf<t.IsPlainObject<{}>>(v).toEqualTypeOf<true>();
      expectTypeOf<t.IsPlainObject<Record<string, unknown>>>(v).toEqualTypeOf<true>();
      expectTypeOf<t.IsPlainObject<{ a: number }>>(v).toEqualTypeOf<true>();
    });

    it('unions distribute', () => {
      type U = t.IsPlainObject<{ a: 1 } | string>;
      expectTypeOf<U>(v).toEqualTypeOf<true | false>();
    });

    it('never propagates', () => {
      const neverValue = undefined as never;
      expectTypeOf<t.IsPlainObject<never>>(neverValue).toEqualTypeOf<never>();
    });
  });
});
