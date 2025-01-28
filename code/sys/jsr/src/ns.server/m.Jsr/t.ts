import type { t } from './common.ts';

/**
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export type JsrServerLib = t.JsrClientLib & {
  /** Tools for working with a module's source-code. */
  readonly Manifest: t.JsrManifestLib;
};
