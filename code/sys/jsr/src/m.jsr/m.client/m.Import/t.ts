/**
 * Tools for formatting `jsr:` import specifiers.
 */
export type JsrImportLib = {
  /**
   * Create a canonical `jsr:` import specifier.
   * Pass `suffix` for subpaths such as `/async`.
   */
  readonly specifier: (pkg: string, version: string, suffix?: string) => string;
};
