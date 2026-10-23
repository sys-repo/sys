/**
 * Tools for formatting `npm:` import specifiers.
 */
export declare namespace NpmImport {
  /** npm import-specifier API. */
  export type Lib = {
    /**
     * Create a canonical `npm:` import specifier.
     * Pass `suffix` for subpaths such as `/jsx-runtime`.
     */
    readonly specifier: (pkg: string, version: string, suffix?: string) => string;
  };
}
