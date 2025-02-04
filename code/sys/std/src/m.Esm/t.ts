import type { t } from './common.ts';

/** A map of {"alias":"module-specifier"} values. */
export type EsmImportMap = { [key: string]: string };

/**
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 */
export type EsmLib = {
  /** Tools for working with groups of modules. */
  readonly Modules: t.EsmModulesLib;
  /** Create an instance of a group-of-modules. */
  modules: t.EsmModulesLib['create'];

  /**
   * Parses an "import" module-specifier string.
   *
   * @param moduleSpecifier - The import string to parse.
   * @returns A EsmImport object if the input is valid
   *          See the `error` property for failure state.
   */
  parse(moduleSpecifier: string): EsmParsedImport;

  /** Convert the parsed-import object to a fully-qualified ESM module-specifier. */
  toString(module: EsmImport): string;
};

/**
 * A parsed ESM import statement.
 */
export type EsmImport = {
  readonly prefix: 'jsr' | 'npm' | '';
  readonly name: string;
  readonly version: t.StringSemver;
};

export type EsmParsedImport = EsmImport & {
  input: string;
  readonly error?: t.StdError;
};

/**
 * Tools for working with group-of-modules (libarary).
 */
export type EsmModulesLib = {
  /** Create an instance of a group-of-modules. */
  create(input?: EsmCreateArray | Readonly<EsmCreateArray>): EsmModules;
};

type EsmCreateArray = (t.StringModuleSpecifier | t.EsmImport)[];

/**
 * Tools for working with group-of-modules (instance).
 */
export type EsmModules = {
  readonly ok: boolean;
  readonly items: Readonly<t.EsmImport[]>;
  readonly error?: t.StdError;
  latest(name: t.StringModuleSpecifier): t.StringSemver;
  latest(deps: t.EsmImportMap): t.EsmImportMap;
};
