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
   * URL for meta-data information about a package as a whole.
   * https://jsr.io/docs/api#package-metadata
   */
  metadata(name: t.StringPkgName): t.StringUrl;

  /**
   * URL for meta-data about a specific package version.
   */
  version(name: t.StringPkgName, version: t.StringSemver): t.StringUrl;

  /**
   * URL for the source code of a given module file.
   * https://jsr.io/docs/api#modules
   */
  file(name: t.StringPkgName, version: t.StringSemver, path: string): t.StringUrl;
};
