import type { t } from './common.ts';

/**
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export declare namespace JsrClient {
  /** JSR client registry API. */
  export type Lib = {
    /** Network fetching helpers against the "jsr.io" end-point. */
    readonly Fetch: t.JsrFetch.Lib;
    /** JSR package-name predicates. */
    readonly Is: t.JsrIs.Lib;
    /** JSR import specifier helpers. */
    readonly Import: t.JsrImport.Lib;
    /** JSR registry URL helpers. */
    readonly Url: t.JsrFetch.Lib['Url'];
  };
}
