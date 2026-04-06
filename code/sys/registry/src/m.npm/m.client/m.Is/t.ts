/**
 * npm package-name predicates.
 */
export type NpmIsLib = {
  /** Determine whether a string is a valid npm package name. */
  readonly pkgName: (input: string) => boolean;
};
