/**
 * Tools for formatting `npm:` import specifiers.
 */
export type NpmImportLib = {
  /**
   * Create a canonical `npm:` import specifier.
   * Pass `suffix` for subpaths such as `/jsx-runtime`.
   */
  readonly specifier: (pkg: string, version: string, suffix?: string) => string;
};
