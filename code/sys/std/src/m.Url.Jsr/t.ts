import type { t } from './common.ts';

/**
 * Standard URL generators for the JSR registry.
 */
export type JsrUrlLib = {
  readonly origin: t.StringUrl;
  readonly Pkg: t.JsrUrlPkgLib;
};

/**
 * URLs pertaining to a specific package within the registry.
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
  file(pkg: t.Pkg, path: string): t.StringUrl;

  /**
   * Canonical contract/module refs for a given source path.
   */
  ref(pkg: t.Pkg, contractPath: string, modulePath: string): t.JsrUrlRef;
};

/**
 * Canonical source URLs linking a package's
 * contract (types) and module (implementation).
 */
export type JsrUrlRef = {
  /** Public contract (type surface). */
  readonly contract: t.StringUrl;
  /** The published code module. */
  readonly module: t.StringUrl;
};
