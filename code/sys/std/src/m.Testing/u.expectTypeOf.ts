/**
 * Compile-time equality assertion.
 *
 *   expectTypeOf(value).toEqualTypeOf<Foo>();
 *
 * • Any mismatch raises a type-checker error.
 * • Zero run-time overhead.
 */
export function expectTypeOf<T>(_value?: T) {
  return {
    /**
     * Succeeds only when the two types are exactly identical.
     *
     * Technique:
     *   1.  `U extends T`   – via the generic constraint.
     *   2.  `T extends U`   – via the tuple parameter below.
     * If either test fails, TypeScript reports an error at the
     * call-site.  Because the parameter is `...[]`, callers pass
     * *no* runtime arguments.
     */
    toEqualTypeOf<U extends T>(
      ..._assert: [T] extends [U] ? ([U] extends [T] ? [] : ['type-mismatch']) : ['type-mismatch']
    ): void {
      /* noop – purely type-level */
    },
  };
}
