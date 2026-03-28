import type { t } from './common.ts';

/**
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export type JsrClientLib = {
  /** Network fetching helpers against the "jsr.io" end-point. */
  readonly Fetch: t.JsrFetch.Lib;
  /** JSR import specifier helpers. */
  readonly Import: t.JsrImportLib;
  /** JSR registry URL helpers. */
  readonly Url: t.JsrFetch.Lib['Url'];
};
