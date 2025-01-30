import type { t } from './common.ts';

/**
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export type JsrServerLib = t.JsrClientLib & {
  /** Tools for working with a module's source-code. */
  readonly Manifest: t.JsrManifestLib;

  /** Create the manifest by fetching the definition from origin. */
  readonly manifest: t.JsrManifestLib['create'];
};
