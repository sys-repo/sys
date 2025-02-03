import type { t } from './common.ts';

/**
 * Tools for working with the dependency/imports of a Deno mono-repo.
 */
export type DenoImportsLib = {
  /** Load the imports definitions from YAML. */
  fromYaml(input: t.StringPath | t.StringYaml): Promise<t.DenoImportsResponse>;

};

/** A response object from a `DenoImports` constructor function. */
export type DenoImportsResponse = { data?: t.DenoImports; error?: t.StdError };
/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type DenoImports = { imports: DenoImport[] };

/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type DenoImport = {
  /**
   * The module-specifier name of the import.
   */
  module: t.EsmParsedImport;

  /** Flag(s) indicating the target file format (`deno.json` OR `package.json`). */
  target: DenoImportTargetFile[];
};

/**
 * The structure the YAML definition file, declaring the imports.
 */
export type DenoYamlImports = { imports: DenoYamlImport[] };
export type DenoYamlImport = {
  /**
   * The name (module-specifier) of an ESM import.
   * eg:
   *    jsr:@sys/tmp@0.0.0
   *    npm:rxjs@7
   */
  import: t.StringModuleSpecifier;

  /** Flag(s) indicating the target file format (`deno.json` OR `package.json`). */
  target: DenoImportTargetFile | DenoImportTargetFile[];
};

/** Flags indicating the target file format (`deno.json` OR `package.json`). */
export type DenoImportTargetFile = 'deno.json' | 'package.json';
