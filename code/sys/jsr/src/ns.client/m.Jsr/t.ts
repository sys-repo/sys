import type { t } from './common.ts';

/**
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export type JsrClientLib = {
  /** Tools for evaluating boolean flags on JSR related data. */
  readonly Is: t.JsrIsLib;

  /** Network fetching helpers against the "jsr.io" end-point. */
  readonly Fetch: t.JsrFetchLib;
};
