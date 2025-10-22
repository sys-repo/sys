import type { t } from './common.ts';

/**
 * Compile-time type assertions (no runtime cost).
 *
 * Usage:
 *   expectTypeOf(value).toEqualTypeOf<Foo>();   // exact, bi-directional equality
 *   expectTypeOf(value).toMatchTypeOf<Foo>();   // assignability (T extends Foo)
 */
export function expectTypeOf<T>(_value: T): t.TypeEqualityMatcher<T> {
  return matcher;
}

/**
 * Shared no-op matcher instance.
 * Methods are type-level only; implementations are runtime no-ops.
 */
const matcher: t.TypeEqualityMatcher<any> = {
  toEqualTypeOf: () => {},
  toMatchTypeOf: () => {},
};
