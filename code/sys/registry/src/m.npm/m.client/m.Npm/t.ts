import type { t } from './common.ts';

/**
 * Tools for working with the npm registry.
 */
export declare namespace NpmClient {
  /** npm client registry helper library surface. */
  export type Lib = {
    /** Network fetching helpers against the npm registry end-point. */
    readonly Fetch: t.NpmFetch.Lib;
    /** npm package-name predicates. */
    readonly Is: t.NpmIs.Lib;
    /** npm import specifier helpers. */
    readonly Import: t.NpmImport.Lib;
    /** npm registry URL helpers. */
    readonly Url: t.NpmFetch.Url.Lib;
  };
}
