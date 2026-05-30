/**
 * npm package-name predicates.
 */
export declare namespace NpmIs {
  /** npm package-name predicate library surface. */
  export type Lib = {
    /** Determine whether a string is a valid npm package name. */
    readonly pkgName: (input: string) => boolean;
  };
}
