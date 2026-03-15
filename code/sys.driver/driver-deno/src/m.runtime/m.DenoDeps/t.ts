import type { t } from './common.ts';
export type * from './t.yaml.ts';

/** Tools and contracts for Deno dependency sets. */
export declare namespace DenoDeps {
  /** Where imports are written when applying deps to a Deno config. */
  export type TargetKind = 'imports' | 'importMap';

  /** Result from applying deps to a `deno.json` or import-map target. */
  export type ApplyResult = {
    /** Whether imports were written inline or via an import map. */
    readonly kind: TargetKind;
    /** Resolved `deno.json` file path. */
    readonly denoFilePath: t.StringPath;
    /** File path that received the rendered imports. */
    readonly targetPath: t.StringPath;
    /** Final import map written to the target. */
    readonly imports: Record<string, t.StringModuleSpecifier>;
  };
}

/** Flags indicating the target file format (`deno.json` OR `package.json`). */
export type DepTargetFile = 'deno.json' | 'package.json';

/**
 * Tools for working with the dependency/imports of a Deno mono-repo.
 */
export type DepsLib = {
  /** Logging helpers */
  readonly Fmt: t.DepsFmt;

  /** Load the imports definitions from YAML. */
  from(input: t.StringPath | t.StringYaml): Promise<t.DepsResult>;

  /** Render deps as a `deno.json` config shape. */
  toJson(kind: 'deno.json', deps?: t.Dep[]): t.PkgJsonDeno;
  /** Render deps as a `package.json` config shape. */
  toJson(kind: 'package.json', deps?: t.Dep[]): t.PkgJsonNode;

  /**
   * Apply Deno imports onto a target `deno.json` config shape.
   *
   * If the target declares `importMap`, the referenced file is updated.
   * Otherwise imports are written inline to the `deno.json` file itself.
   */
  apply(path: t.StringPath | undefined, deps?: t.Dep[]): Promise<DenoDeps.ApplyResult>;

  /** Convert deps into YAML.  */
  toYaml(deps: t.Dep[], options?: t.DepsYamlOptions): t.DepsYaml;

  /** Convert to a dependency representation. */
  toDep(
    module: t.EsmImport | t.StringModuleSpecifier,
    options?: {
      target?: t.DepTargetFile | t.DepTargetFile[];
      dev?: boolean;
      subpaths?: t.StringDir[];
    },
  ): t.Dep;

  /** Find the canonical import specifier for a versionless dependency stem. */
  findImport(deps: t.Dep[] | undefined, input: t.StringModuleSpecifier): t.StringModuleSpecifier | undefined;
};

/** A response object from a `DenoDeps` constructor function. */
export type DepsResult = {
  /** Parsed dependency set when loading succeeded. */
  data?: t.Deps;
  /** Load or parse error when dependency data could not be produced. */
  error?: t.StdError;
};

/**
 * A common data-structure for expressing an ESM "import"
 * (normalized between 'deno.json' and 'package.json")
 */
export type Deps = {
  /** Normalized dependency entries. */
  readonly deps: t.Dep[];
  /** Parsed ESM module set derived from the deps. */
  readonly modules: t.EsmModules;
  /** Render the dependency set back to YAML. */
  toYaml(options?: t.DepsYamlOptions): t.DepsYaml;
};

/**
 * The dependency-set as YAML.
 * Use this to stringify save "<deps>.yaml" files, which in turn can
 * be passed back in through the `DenoDeps.from("./deps.yaml")` method.
 */
export type DepsYaml = {
  /** Structured YAML dependency object. */
  readonly obj: t.YamlDeps;
  /** Serialized YAML text. */
  readonly text: t.StringYaml;
  /** Stringify the YAML wrapper. */
  toString(): string;
};

/** Options passed to the `DenoDeps.toYaml` method. */
export type DepsYamlOptions = {
  /** Optional grouping callback for named YAML groups. */
  groupBy?: DepsCategorizeByGroup;
};

/** Categorize a dependency into a group (Nothing response is ungrouped). */
export type DepsCategorizeByGroup = (e: t.DepsCategorizeByGroupArgs) => t.IgnoredResult;
/** Arguments passed to the dependency grouping callback. */
export type DepsCategorizeByGroupArgs = {
  /** Dependency currently being grouped. */
  dep: t.Dep;
  /** Target file kinds attached to the dependency. */
  target: t.DepTargetFile | t.DepTargetFile[];
  /** Assign the dependency to a named YAML group. */
  group(name: string, options?: { subpaths?: t.StringDir[]; dev?: boolean }): void;
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
   * Array of sub-paths for the module.
   * Causes an import (within deno.json), like:
   *
   *    "yaml"
   *    "yaml/types"
   */
  subpaths?: t.StringDir[];

  /**
   * Flag indicating if the import is a development-dependency only.
   * Only relevant when producing a `package.json` file.
   */
  dev?: boolean;
};

/**
 * Logging helpers.
 */
export type DepsFmt = {
  /** Log a list of deps to a table. */
  deps(deps?: t.Dep[], options?: { indent?: number }): string;
};
