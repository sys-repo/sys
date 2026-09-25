/**
 * Tools for formatting `jsr:` import specifiers.
 */
export declare namespace JsrImport {
  /** JSR import-specifier API. */
  export type Lib = {
    /**
     * Create a canonical `jsr:` import specifier.
     * Pass `suffix` for subpaths such as `/async`.
     */
    readonly specifier: (pkg: string, version: string, suffix?: string) => string;
  };
}
