import type { t } from './common.ts';
export type * from './t.yaml.ts';

/** Flags indicating the target file format (`deno.json` OR `package.json`). */
export type DenoDepTargetFile = 'deno.json' | 'package.json';

/**
 * Tools for working with the dependency/imports of a Deno mono-repo.
 */
export type DenoDepsLib = {
  /** Logging helpers */
  readonly Fmt: t.DenoDepsFmt;

  /** Load the imports definitions from YAML. */
  from(input: t.StringPath | t.StringYaml): Promise<t.DenoDepsResponse>;

  /** Convert deps to a `deno.json` format. */
  toDenoJson(deps?: t.DenoDep[]): t.PkgJsonDeno;

  /** Convert deps to a `package.json` format. */
  toPackageJson(deps?: t.DenoDep[]): t.PkgJsonNode;
};

/** A response object from a `DenoDeps` constructor function. */
export type DenoDepsResponse = { data?: t.DenoDeps; error?: t.StdError };

/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type DenoDeps = {
  readonly deps: DenoDep[];
  readonly modules: t.EsmModules;
};

/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type DenoDep = {
  /** The module-specifier name of the import. */
  module: t.EsmParsedImport;

  /** Flag(s) indicating the target file format (`deno.json` OR `package.json`). */
  target: DenoDepTargetFile[];

  /**
   * Flag indicating if the import is a development-dependency only.
   * Only relevant when producing a `package.json` file.
   */
  dev?: boolean;

  /**
   * Flag indicating if a wildcard entry should be inserted into an generated import-map.
   * Causes an import (within deno.json), like:
   *
   *    "@noble/hashes"
   *    "@noble/hashes/*"
   */
  wildcard?: boolean;
};

/**
 * Logging helpers.
 */
export type DenoDepsFmt = {
  /** Log a list of deps to a table. */
  deps(deps?: t.DenoDep[], options?: { indent?: number }): string;
};
