import type { t } from '../common.ts';
import type { EsmTopological } from '../m.Topological/t.ts';
import type { EsmPolicy } from '../m.Policy/t.ts';

/** A map of {"alias":"module-specifier"} values. */
export type EsmImportMap = { readonly [key: string]: string };

/** Values representing public registries of ESM modules. */
export type EsmRegistry = 'jsr' | 'npm';

/** Public dependency policy modes for ESM upgrade selection. */
export type EsmPolicyMode = EsmPolicy.Mode;
/** Public dependency policy input. */
export type EsmPolicyInput = EsmPolicy.Input;
/** Public dependency policy decision. */
export type EsmPolicyDecision = EsmPolicy.Decision;
/** Public dependency policy result. */
export type EsmPolicyResult = EsmPolicy.Result;
/** Public topological ordering input. */
export type EsmTopologicalInput = EsmTopological.DecisionInput;
/** Public topological ordering result. */
export type EsmTopologicalResult = EsmTopological.DecisionResult;

/** Core ESM import and dependency helpers. */
export type EsmLib = {
  /** Pure topological dependency ordering. */
  readonly Topological: EsmTopological.Lib;
  /** Pure dependency policy algebra. */
  readonly Policy: EsmPolicy.Lib;
  /** Tools for working with groups of modules. */
  readonly Modules: EsmModulesLib;
  /** Create an instance of a group-of-modules. */
  modules: EsmModulesLib['create'];
  /** Lightweight lexical check for obvious default-export forms in module source text. */
  hasDefaultExport(source: string): boolean;

  /**
   * Parses an "import" module-specifier string.
   *
   * @param moduleSpecifier - The import string to parse.
   * @returns A EsmImport object if the input is valid
   *          See the `error` property for failure state.
   */
  parse(moduleSpecifier: string, alias?: string): EsmParsedImport;

  /** Convert the parsed-import object to a fully-qualified ESM module-specifier. */
  toString(module: EsmImport, options?: EsmToStringOptions): string;
};

/** Options for the `Esm.toString` method. */
export type EsmToStringOptions = {
  /** Replace registry. */
  readonly registry?: EsmImport['registry'];

  /** Replace name. */
  readonly name?: EsmImport['name'];

  /** Replace version. */
  readonly version?: EsmImport['version'];

  /** Replace subpath. */
  readonly subpath?: EsmImport['subpath'];
};

/** A parsed ESM import statement. */
export type EsmImport = {
  readonly registry: EsmRegistry | '';
  readonly name: string;
  readonly version: t.StringSemver;
  readonly subpath: string;
  /** An alternative name used by the import (eg. in the key of an `import_map.json`). */
  readonly alias?: string;
  toString(): string;
};

/** The result from an `ESM.parse` operation. */
export type EsmParsedImport = EsmImport & {
  readonly input: string;
  readonly error?: t.StdError;
};

/** Tools for working with group-of-modules (libarary). */
export type EsmModulesLib = {
  /** Create an instance of a group-of-modules. */
  create(input?: EsmCreateArray | Readonly<EsmCreateArray>): EsmModules;
};

type EsmCreateArray = (t.StringModuleSpecifier | EsmImport)[];

/** Tools for working with group-of-modules (instance). */
export type EsmModules = {
  readonly ok: boolean;
  readonly items: Readonly<EsmImport[]>;
  readonly count: number;
  readonly error?: t.StdError;
  latest(name: t.StringModuleSpecifier): t.StringSemver;
  latest(deps: EsmImportMap): EsmImportMap;
};
