import type { t } from './common.ts';
export type * from './t.yaml.ts';

/** Tools and contracts for Deno dependency projection and apply helpers. */
export declare namespace DenoDeps {
  /** Where imports are written when applying deps to a Deno config. */
  export type TargetKind = 'imports' | 'importMap';

  /** Result from writing canonical deps back to a deps.yaml file. */
  export type ApplyYamlResult = {
    /** Resolved deps.yaml file path. */
    readonly depsFilePath: t.StringPath;
    /** Rendered YAML payload written to disk. */
    readonly yaml: t.DepsYaml;
  };

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

  /** Result from applying deps to a `package.json` target. */
  export type ApplyPackageResult = {
    /** Resolved `package.json` file path. */
    readonly packageFilePath: t.StringPath;
    /** Final runtime dependency map written to `package.json`. */
    readonly dependencies: Record<string, t.StringSemver>;
    /** Final development dependency map written to `package.json`. */
    readonly devDependencies: Record<string, t.StringSemver>;
  };

  /** Result from applying canonical deps to deps.yaml and projected Deno files. */
  export type ApplyFilesResult = {
    /** Result from writing deps.yaml. */
    readonly yaml: ApplyYamlResult;
    /** Result from applying projected Deno imports. */
    readonly deno: ApplyResult;
    /** Result from applying projected Node dependencies. */
    readonly package: ApplyPackageResult;
  };
}

/** Flags indicating the target file format (`deno.json` OR `package.json`). */
export type DepTargetFile = 'deno.json' | 'package.json';

/**
 * Deno-facing dependency projection and apply helpers.
 */
export type DepsLib = {
  /** Logging helpers */
  readonly Fmt: t.DepsFmt;

  /** Load canonical dependency manifest data via `@sys/esm/deps`. */
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
  applyDeno(path: t.StringPath | undefined, deps?: t.Dep[]): Promise<DenoDeps.ApplyResult>;

  /** Apply package dependencies onto a target `package.json` config shape. */
  applyPackage(
    path: t.StringPath | undefined,
    deps?: t.Dep[],
  ): Promise<DenoDeps.ApplyPackageResult>;

  /** Write canonical dependency YAML back to a deps.yaml target. */
  applyYaml(
    path: t.StringPath | undefined,
    deps?: t.Dep[],
    options?: t.DepsYamlOptions,
  ): Promise<DenoDeps.ApplyYamlResult>;

  /** Apply canonical deps to deps.yaml and projected Deno files together. */
  applyFiles(
    input: {
      readonly depsPath?: t.StringPath;
      readonly denoFilePath?: t.StringPath;
      readonly packageFilePath?: t.StringPath;
      readonly yaml?: t.DepsYamlOptions;
    },
    deps?: t.Dep[],
  ): Promise<DenoDeps.ApplyFilesResult>;

  /** Render canonical dependency entries back to YAML. */
  toYaml(deps: t.Dep[], options?: t.DepsYamlOptions): t.DepsYaml;

  /** Normalize an import into a dependency entry. */
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

/** Result from loading canonical dependency manifest data through the Deno adapter. */
export type DepsResult = {
  /** Parsed dependency set when loading succeeded. */
  data?: t.Deps;
  /** Load or parse error when dependency data could not be produced. */
  error?: t.StdError;
};

/**
 * Canonical dependency entries carried through the Deno adapter.
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
 * Canonical dependency YAML rendered through the Deno adapter.
 */
export type DepsYaml = {
  /** Structured YAML dependency object. */
  readonly obj: t.YamlDeps;
  /** Serialized YAML text. */
  readonly text: t.StringYaml;
  /** Stringify the YAML wrapper. */
  toString(): string;
};

/** Options passed to the `DenoDeps.toYaml` adapter method. */
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
 * Canonical dependency entry shape carried through the Deno adapter.
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
