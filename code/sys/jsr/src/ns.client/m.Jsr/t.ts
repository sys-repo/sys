import type { t } from './common.ts';

/**
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export type JsrClientLib = {
  /** Network fetching helpers against the "jsr.io" end-point. */
  readonly Fetch: t.JsrFetchLib;
};
