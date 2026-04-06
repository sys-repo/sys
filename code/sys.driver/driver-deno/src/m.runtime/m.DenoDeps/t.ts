import type { t } from './common.ts';
export type * from './t.yaml.ts';

/** Tools and contracts for Deno dependency projection and apply helpers. */
export declare namespace DenoDeps {
  export type TargetKind = t.EsmDeps.TargetKind;
  export type ApplyYamlResult = t.EsmDeps.ApplyYamlResult;
  export type ApplyResult = t.EsmDeps.ApplyResult;
  export type ApplyPackageResult = t.EsmDeps.ApplyPackageResult;
  export type ApplyFilesResult = t.EsmDeps.ApplyFilesResult;
  export type VerifyDenoInput = {
    /** Root directory used for glob matching and `deno check` execution. */
    readonly cwd?: t.StringDir;
    /** `deno.json` or `deno.jsonc` config path used during verification. */
    readonly configPath?: t.StringPath;
    /** Source globs to verify against the projected Deno imports. */
    readonly include: readonly t.StringPath[];
  };
  export type VerifyDenoResult = {
    /** Resolved working directory used during verification. */
    readonly cwd: t.StringDir;
    /** Resolved Deno config file passed to `deno check`. */
    readonly configPath: t.StringPath;
    /** Resolved source files checked by Deno. */
    readonly paths: readonly t.StringPath[];
  };
}

/** Flags indicating the target file format (`deno.json` OR `package.json`). */
export type DepTargetFile = t.EsmDeps.TargetFile;

/**
 * Deno-facing dependency projection and apply helpers.
 */
export type DepsLib = {
  /** Logging helpers */
  readonly Fmt: t.DepsFmt;

  /** Load canonical dependency manifest data via `@sys/esm/deps`. */
  from(input: t.StringPath | t.StringYaml): Promise<t.DepsResult>;

  /** Render deps as a `deno.json` config shape. */
  toJson(kind: 'deno.json', deps?: t.Dep[]): t.PkgDenoJson;
  /** Render deps as a `package.json` config shape. */
  toJson(kind: 'package.json', deps?: t.Dep[]): t.PkgNodeJson;

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
  ): Promise<DenoDeps.ApplyPackageResult | undefined>;

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

  /** Verify projected Deno imports satisfy source specifiers for the given file globs. */
  verifyDeno(
    input: DenoDeps.VerifyDenoInput,
  ): Promise<DenoDeps.VerifyDenoResult>;

  /** Render canonical dependency entries back to YAML. */
  toYaml(deps: t.Dep[], options?: t.DepsYamlOptions): t.DepsYaml;

  /** Normalize an import into a dependency entry. */
  toDep(
    module: t.EsmImport | t.StringModuleSpecifier,
    options?: {
      target?: t.DepTargetFile | t.DepTargetFile[];
      dev?: boolean;
      name?: string;
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
export type DepsYaml = t.EsmDeps.Yaml;

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
export type Dep = t.EsmDeps.Entry;

/**
 * Logging helpers.
 */
export type DepsFmt = {
  /** Log a list of deps to a table. */
  deps(deps?: t.Dep[], options?: { indent?: number }): string;
};
