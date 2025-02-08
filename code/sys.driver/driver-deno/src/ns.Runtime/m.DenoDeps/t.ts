import type { t } from './common.ts';
export type * from './t.yaml.ts';

/** Flags indicating the target file format (`deno.json` OR `package.json`). */
export type DepTargetFile = 'deno.json' | 'package.json';

/**
 * Tools for working with the dependency/imports of a Deno mono-repo.
 */
export type DepsLib = {
  /** Logging helpers */
  readonly Fmt: t.DepsFmt;

  /** Load the imports definitions from YAML. */
  from(input: t.StringPath | t.StringYaml): Promise<t.DepsResponse>;

  /** Convert deps to a `deno.json` or `package.json` format. */
  toJson(kind: 'deno.json', deps?: t.Dep[]): t.PkgJsonDeno;
  toJson(kind: 'package.json', deps?: t.Dep[]): t.PkgJsonNode;
};

/** A response object from a `DenoDeps` constructor function. */
export type DepsResponse = { data?: t.Deps; error?: t.StdError };

/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type Deps = {
  readonly deps: Dep[];
  readonly modules: t.EsmModules;
};

/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type Dep = {
  /** The module-specifier name of the import. */
  module: t.EsmParsedImport;

  /** Flag(s) indicating the target file format (`deno.json` OR `package.json`). */
  target: DepTargetFile[];

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
export type DepsFmt = {
  /** Log a list of deps to a table. */
  deps(deps?: t.Dep[], options?: { indent?: number }): string;
};
