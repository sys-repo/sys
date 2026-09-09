import type { t } from './common.ts';

/**
 * Deno-facing dependency projection and apply helpers.
 */
export declare namespace DenoDeps {
  /** Runtime surface for Deno dependency projection and apply helpers. */
  export type Lib = {
    /** Logging helpers. */
    readonly Fmt: Fmt.Lib;

    /** Load canonical dependency manifest data via `@sys/esm/deps`. */
    from(input: t.StringPath | t.StringYaml): Promise<LoadResult>;

    /** Render deps as a `deno.json` config shape. */
    toJson(kind: 'deno.json', deps?: Dep[]): t.PkgDenoJson;
    /** Render deps as a `package.json` config shape. */
    toJson(kind: 'package.json', deps?: Dep[]): t.PkgNodeJson;

    /**
     * Apply Deno imports onto a target `deno.json` config shape.
     *
     * If the target declares `importMap`, the referenced file is updated.
     * Otherwise imports are written inline to the `deno.json` file itself.
     */
    applyDeno(path: t.StringPath | undefined, deps?: Dep[]): Promise<Apply.DenoResult>;

    /** Apply package dependencies onto a target `package.json` config shape. */
    applyPackage(
      path: t.StringPath | undefined,
      deps?: Dep[],
    ): Promise<Apply.PackageResult | undefined>;

    /** Write canonical dependency YAML back to a deps.yaml target. */
    applyYaml(
      path: t.StringPath | undefined,
      deps?: Dep[],
      options?: YamlOptions,
    ): Promise<Apply.YamlResult>;

    /** Apply canonical deps to deps.yaml and projected Deno files together. */
    applyFiles(input: Apply.FilesInput, deps?: Dep[]): Promise<Apply.FilesResult>;

    /** Verify projected Deno imports satisfy source specifiers for the given file globs. */
    verifyDeno(input: VerifyDeno.Input): Promise<VerifyDeno.Result>;

    /** Render canonical dependency entries back to YAML. */
    toYaml(deps: Dep[], options?: YamlOptions): Yaml;

    /** Normalize an import into a dependency entry. */
    toDep(module: t.EsmImport | t.StringModuleSpecifier, options?: ToDepOptions): Dep;

    /** Find the canonical import specifier for a versionless dependency stem. */
    findImport(
      deps: Dep[] | undefined,
      input: t.StringModuleSpecifier,
    ): t.StringModuleSpecifier | undefined;
  };

  /** Flags indicating the target file format (`deno.json` OR `package.json`). */
  export type TargetFile = t.EsmDeps.TargetFile;

  /** Flags indicating the dependency target kind. */
  export type TargetKind = t.EsmDeps.TargetKind;

  /** Canonical dependency entry shape carried through the Deno adapter. */
  export type Dep = t.EsmDeps.Entry;

  /** Result from loading canonical dependency manifest data through the Deno adapter. */
  export type LoadResult = {
    /** Parsed dependency set when loading succeeded. */
    data?: Manifest;
    /** Load or parse error when dependency data could not be produced. */
    error?: t.StdError;
  };

  /** Canonical dependency entries carried through the Deno adapter. */
  export type Manifest = {
    /** Normalized dependency entries. */
    readonly deps: Dep[];
    /** Parsed ESM module set derived from the deps. */
    readonly modules: t.EsmModules;
    /** Render the dependency set back to YAML. */
    toYaml(options?: YamlOptions): Yaml;
  };

  /** Canonical dependency YAML rendered through the Deno adapter. */
  export type Yaml = t.EsmDeps.Yaml;

  /** Options passed to the `DenoDeps.toYaml` adapter method. */
  export type YamlOptions = {
    /** Optional grouping callback for named YAML groups. */
    groupBy?: GroupBy;
  };

  /** Categorize a dependency into a group (Nothing response is ungrouped). */
  export type GroupBy = (e: GroupByArgs) => t.IgnoredResult;

  /** Arguments passed to the dependency grouping callback. */
  export type GroupByArgs = {
    /** Dependency currently being grouped. */
    dep: Dep;
    /** Target file kinds attached to the dependency. */
    target: TargetFile | TargetFile[];
    /** Assign the dependency to a named YAML group. */
    group(name: string, options?: { subpaths?: t.StringDir[]; dev?: boolean }): void;
  };

  /** Options for normalizing an import into a dependency entry. */
  export type ToDepOptions = {
    target?: TargetFile | TargetFile[];
    dev?: boolean;
    name?: string;
    subpaths?: t.StringDir[];
  };

  /**
   * Apply helper contracts.
   */
  export namespace Apply {
    /** Result from applying Deno imports onto a `deno.json` or import-map target. */
    export type DenoResult = t.EsmDeps.ApplyResult;

    /** Result from applying package dependencies onto a `package.json` target. */
    export type PackageResult = t.EsmDeps.ApplyPackageResult;

    /** Result from writing canonical dependency YAML. */
    export type YamlResult = t.EsmDeps.ApplyYamlResult;

    /** Result from applying canonical deps to deps.yaml and projected Deno files together. */
    export type FilesResult = t.EsmDeps.ApplyFilesResult;

    /** Input for applying canonical deps to deps.yaml and projected Deno files together. */
    export type FilesInput = {
      readonly depsPath?: t.StringPath;
      readonly denoFilePath?: t.StringPath;
      readonly packageFilePath?: t.StringPath;
      readonly yaml?: YamlOptions;
    };
  }

  /**
   * Projected-import verification contracts.
   */
  export namespace VerifyDeno {
    /** Input for verifying projected Deno imports against source specifiers. */
    export type Input = {
      /** Root directory used for glob matching and `deno check` execution. */
      readonly cwd?: t.StringDir;
      /** `deno.json` or `deno.jsonc` config path used during verification. */
      readonly configPath?: t.StringPath;
      /** Source globs to verify against the projected Deno imports. */
      readonly include: readonly t.StringPath[];
    };

    /** Result from verifying projected Deno imports against source specifiers. */
    export type Result = {
      /** Resolved working directory used during verification. */
      readonly cwd: t.StringDir;
      /** Resolved Deno config file passed to `deno check`. */
      readonly configPath: t.StringPath;
      /** Resolved source files checked by Deno. */
      readonly paths: readonly t.StringPath[];
    };
  }

  /**
   * Logging helper contracts.
   */
  export namespace Fmt {
    /** Logging helpers. */
    export type Lib = {
      /** Log a list of deps to a table. */
      deps(deps?: Dep[], options?: { indent?: number }): string;
    };
  }

  /**
   * Authored dependency YAML file contracts.
   */
  export namespace YamlFile {
    /** Structure of the YAML definition file. */
    export type Shape = {
      /** Reusable named dependency groups. */
      groups?: Groups;
      /** Dependency entries that target `deno.json`. */
      'deno.json'?: Dep[];
      /** Dependency entries that target `package.json`. */
      'package.json'?: Dep[];
    };

    /** Named dependency group name. */
    export type GroupName = string;

    /** Map of group names to reusable dependency entries. */
    export type Groups = { [groupname: GroupName]: Group[] };

    /** Represents a module dependency of the workspace. */
    export type Dep = {
      /**
       * The name (module-specifier) of an ESM import.
       * eg:
       *    jsr:@sys/tmp@0.0.0
       *    npm:rxjs@7
       */
      import?: t.StringModuleSpecifier;

      /** Name of an import group to include. */
      group?: GroupName;

      /** Array of sub-paths for the module. */
      subpaths?: t.StringDir[];

      /** Override name to use if different from the `import` module-name. */
      name?: string;

      /**
       * Flag indicating if the import is a development-dependency only.
       * Only relevant when producing a `package.json` file.
       */
      dev?: boolean;
    };

    /** Reusable YAML dependency entry stored under a group. */
    export type Group = Omit<Dep, 'group'>;
  }
}
