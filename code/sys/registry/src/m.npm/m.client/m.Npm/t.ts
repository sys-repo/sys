import type { t } from './common.ts';

/**
 * Tools for working with the npm registry.
 */
export type NpmClientLib = {
  /** Network fetching helpers against the npm registry end-point. */
  readonly Fetch: t.NpmFetch.Lib;
  /** npm package-name predicates. */
  readonly Is: t.NpmIsLib;
  /** npm import specifier helpers. */
  readonly Import: t.NpmImportLib;
  /** npm registry URL helpers. */
  readonly Url: t.NpmFetch.Lib['Url'];
};
