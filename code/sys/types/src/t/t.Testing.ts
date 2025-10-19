/**
 * Type-level assertion helpers for compile-time type checking.
 */
export type TypeEqualityMatcher<T> = {
  /** Compile-time exact type equality (T and U are mutually assignable). */
  toEqualTypeOf<U extends T>(
    ..._assert: [T] extends [U] ? ([U] extends [T] ? [] : ['type-mismatch']) : ['type-mismatch']
  ): void;

  /** Compile-time assignability check (T is assignable to U). */
  toMatchTypeOf<U>(..._assert: [T] extends [U] ? [] : ['not-assignable']): void;
};
