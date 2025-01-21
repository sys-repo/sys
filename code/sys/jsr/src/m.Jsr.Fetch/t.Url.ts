import type { t } from './common.ts';

/**
 * Standard URL generators for the JSR registry.
 */
export type JsrUrlLib = {
  readonly origin: t.StringUrl;
  readonly Pkg: t.JsrUrlPkgLib;
};
/**
 * URLs pertaining to packages.
 */
export type JsrUrlPkgLib = {
  /**
   * Generate the URL for meta-data information about a package as a whole.
   * https://jsr.io/docs/api#package-metadata
   */
  metadata(name: string): t.StringUrl;

  /**
   * Generate the URL for meta-data about a specific package version.
   */
  version(name: string, version: t.StringSemver): t.StringUrl;
};
