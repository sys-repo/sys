/**
 * JSR package-name predicates.
 */
export type JsrIsLib = {
  /** Determine whether a string is a valid JSR package name. */
  readonly pkgName: (input: string) => boolean;
};
