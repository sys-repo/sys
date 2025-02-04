import type { t } from './common.ts';

/** Flags indicating the target file format (`deno.json` OR `package.json`). */
export type DenoDepTargetFile = 'deno.json' | 'package.json';

/**
 * Tools for working with the dependency/imports of a Deno mono-repo.
 */
export type DenoDepsLib = {
  /** Load the imports definitions from YAML. */
  fromYaml(input: t.StringPath | t.StringYaml): Promise<t.DenoDepsResponse>;

  /** Convert deps to a `deno.json` format. */
  toDenoJson(input?: t.DenoDeps): t.PkgJsonDeno;

  /** Convert deps to a `package.json` format. */
  toPackageJson(input?: t.DenoDeps): t.PkgJsonNode;
};

/** A response object from a `DenoDeps` constructor function. */
export type DenoDepsResponse = { data?: t.DenoDeps; error?: t.StdError };

/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type DenoDeps = { imports: DenoDep[] };

/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type DenoDep = {
  /**
   * The module-specifier name of the import.
   */
  module: t.EsmParsedImport;

  /** Flag(s) indicating the target file format (`deno.json` OR `package.json`). */
  target: DenoDepTargetFile;

  /**
   * Flag indicating if the import is a development-dependency only.
   * Only relevant when producing a `package.json` file.
   */
  dev?: boolean;

  /** Flag indicating if a wildcard entry should be inserted into an generated import-map. */
  wildcard?: boolean;
};

/**
 * The structure the YAML definition file, declaring the imports.
 */
export type DenoYamlDeps = {
  'deno.json': t.DenoYamlDepDeno[];
  'package.json': t.DenoYamlDepNode[];
};

export type DenoYamlDep = {
  /**
   * The name (module-specifier) of an ESM import.
   * eg:
   *    jsr:@sys/tmp@0.0.0
   *    npm:rxjs@7
   */
  import: t.StringModuleSpecifier;

  /** Flag(s) indicating the target file format (`deno.json` OR `package.json`). */
  target: DenoDepTargetFile | DenoDepTargetFile[];
};

export type DenoYamlDepDeno = DenoYamlDep & {
  /** Flag indicating if a wildcard entry should be inserted into an generated import-map. */
  wildcard?: boolean;
};

export type DenoYamlDepNode = DenoYamlDep & {
  /**
   * Flag indicating if the import is a development-dependency only.
   * Only relevant when producing a `package.json` file.
   */
  dev?: boolean;
};
