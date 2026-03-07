/**
 * Namespace of Type (system) helpers.
 * Pure type space; emits no runtime.
 */
export namespace Type {
  /** A === B (bi-conditional) */
  export type Equal<A, B> =
    (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;

  /** A !== B */
  export type NotEqual<A, B> = Equal<A, B> extends true ? false : true;

  /** Assert<true> passes; anything else fails */
  export type Assert<T extends true> = T;

  /** A ⊆ B */
  export type Extends<A, B> = A extends B ? true : false;

  /** Assert A ⊆ B */
  export type AssertExtends<A, B> = A extends B ? true : never;
}
