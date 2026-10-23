import type { t } from '../common.ts';

/**
 * Helpers for wrangling DevHarness URL params.
 */
export type DevUrlParamsLib = {
  /** Determine if the given URL is a "dev mode" address. */
  isDev(location?: t.UrlInput): boolean;

  /** Format a URL with the ?dev flag. */
  formatDevFlag(options?: {
    location?: t.UrlInput;
    defaultNamespace?: string;
    forceDev?: boolean;
  }): URL;

  /** Ensure the ?dev flag exists on the URL parameter */
  ensureDevFlag(options?: { location?: t.UrlInput }): URL;
};

/**
 * Helpers for working with the DevHarness URL.
 */
export type DevUrlLib = {
  /** Helpers for wrangling DevHarness URL params. */
  readonly navigate: t.DevUrlParamsLib;

  /** Convert an input location into a standard [URL] object. */
  location(value?: t.UrlInput): URL;

  /** Derive a compact, transient URL identifier from a canonical module namespace. */
  moduleId(namespace: string): string;

  /** Derive and load the module from the given URL. */
  module(url: URL, specs: t.SpecImports): Promise<any | undefined>;

  /** Match a canonical namespace or compact URL identifier to imported specs. */
  moduleMatches(field: string, specs: t.SpecImports): { namespace: string; fn: t.SpecImporter }[];
};

/**
 * Helpers for evaluating DevHarness arguments.
 */
export type DevArgsLib = {
  /** Wrangles a dev URL */
  readonly Url: t.DevUrlLib;

  /** Wrangles the dev params. */
  readonly Params: t.DevUrlParamsLib;
};
