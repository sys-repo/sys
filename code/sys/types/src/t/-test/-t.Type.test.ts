import { describe, it } from '../../-test.ts';
import type { t } from '../common.ts';

/**
 * These assertions run at compile time only.
 * If a relation is wrong, the file fails type-checking.
 */
describe('Types: Type (compile-time guards)', () => {
  // Equality (order-insensitive unions)
  type _eq_union = t.Type.Assert<t.Type.Equal<'a' | 'b', 'b' | 'a'>>;

  // Equality (structural objects)
  type _eq_obj = t.Type.Assert<t.Type.Equal<{ a: number }, { a: number }>>;

  // Inequality (distinct literals)
  type _neq_literals = t.Type.Assert<t.Type.NotEqual<'a', 'b'>>;

  // Extends (subset)
  type _extends = t.Type.Assert<t.Type.Extends<'a', string>>;

  // AssertExtends (never extends everything)
  type _assert_extends_never = t.Type.Assert<t.Type.AssertExtends<never, string>>;

  // Branded types are distinct
  type Brand<T, B extends string> = T & { readonly __brand: B };
  type UserId = Brand<string, 'UserId'>;
  type OrderId = Brand<string, 'OrderId'>;
  type _neq_brands = t.Type.Assert<t.Type.NotEqual<UserId, OrderId>>;

  // ——— Negative examples (intentionally commented; uncomment to see failures) ———
  // type _should_fail_eq = t.Type.Assert<t.Type.Equal<'a', 'b'>>;
  // type _should_fail_extends = t.Type.Assert<t.Type.Extends<string, 'a'>>;
  // type _should_fail_assert_extends = t.Type.Assert<t.Type.AssertExtends<'a' | 'b', 'a'>>;

  // Keep a no-op test so the suite has a runnable case.
  it('compiles', () => {
    // No runtime assertions; success = file type-checks.
  });
});
