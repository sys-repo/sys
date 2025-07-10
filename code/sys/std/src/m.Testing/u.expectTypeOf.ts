import type { t } from './common.ts';

/**
 * Compile-time equality assertion.
 *
 *  • Any mismatch raises a type-checker error.
 *  • Zero run-time overhead.
 *
 * Usage:
 *
 *      expectTypeOf(value).toEqualTypeOf<Foo>();
 *
 */
export function expectTypeOf<T>(_value: T): t.TypeEqualityMatcher<T> {
  return matcher;
}

// NB A shared noop matcher instance - allocated only once.
const matcher: t.TypeEqualityMatcher<any> = {
  toEqualTypeOf: () => {}, // (noop) – purely type-level.
};
