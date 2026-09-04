import type { t } from './common.ts';

/**
 * Tools for working with JSR ("the Javascript Registry").
 * https://jsr.io/docs
 */
export declare namespace JsrServer {
  /** JSR server registry API. */
  export type Lib = t.JsrClient.Lib & {
    /** Tools for working with a module's source-code. */
    readonly Manifest: t.JsrManifest.Lib;

    /** Create the manifest by fetching the definition from origin. */
    readonly manifest: t.JsrManifest.Lib['fetch'];
  };
}
