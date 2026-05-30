/**
 * JSR package-name predicates.
 */
export declare namespace JsrIs {
  /** JSR package-name predicate library surface. */
  export type Lib = {
    /** Determine whether a string is a valid JSR package name. */
    readonly pkgName: (input: string) => boolean;
  };
}
