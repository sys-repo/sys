import type { t } from './common.ts';

/**
 * Canonical dependency declarations: `deps.yaml` is the authority;
 * Deno imports and `package.json` dependency fields are its projections.
 */
export declare namespace EsmDeps {
  /** Where imports are written when applying deps to a Deno config. */
  export type TargetKind = 'imports' | 'importMap';

  /** Read and render dependency declarations; apply them to their target files. */
  export type Lib = {
    /** Normalize dependency declarations from YAML text or a `.yaml` / `.yml` path. */
    from(input: t.StringPath | t.StringYaml): Promise<Result>;
    /**
     * Project dependencies into inline Deno imports or a referenced import map.
     *
     * Config-load and write failures reject. The config is written before its import map;
     * earlier writes and partial output may remain.
     */
    applyDeno(path: t.StringPath | undefined, entries?: Entry[]): Promise<ApplyResult>;
    /**
     * Replace dependencies and resolver overrides in `package.json`.
     * No target returns `undefined` without writing. Write failures reject; partial output may remain.
     */
    applyPackage(
      path: t.StringPath | undefined,
      entries?: Entry[],
      options?: PackageProjectionOptions,
    ): Promise<ApplyPackageResult | undefined>;
    /**
     * Persist dependency declarations in canonical YAML form.
     * Write failures reject; partial output may remain.
     */
    applyYaml(
      path: t.StringPath | undefined,
      entries?: Entry[],
      options?: YamlOptions,
    ): Promise<ApplyYamlResult>;
    /**
     * Write the manifest and its projections from one set of dependency declarations.
     *
     * Writes follow `deps.yaml` → Deno imports → optional `package.json` and stop on the first failure.
     * Rejection is not rollback: earlier writes and partial output may remain.
     */
    applyFiles(
      input: {
        readonly depsPath?: t.StringPath;
        readonly denoFilePath?: t.StringPath;
        readonly packageFilePath?: t.StringPath;
        readonly yaml?: ApplyFilesYamlOptions;
        readonly packageJson?: PackageJsonPolicy;
      },
      entries?: Entry[],
    ): Promise<ApplyFilesResult>;
    /** Render canonical YAML without writing files. */
    toYaml(entries: Entry[], options?: YamlOptions): Yaml;
    /** Pair an ESM import with its projection targets and metadata; default to `deno.json`. */
    toEntry(
      module: t.EsmImport | t.StringModuleSpecifier,
      options?: {
        target?: TargetFile | TargetFile[];
        dev?: boolean;
        name?: string;
        subpaths?: t.StringDir[];
      },
    ): Entry;
    /**
     * Return the first declared specifier matching the input's registry and package name.
     * The input's version does not constrain the match.
     */
    findImport(
      entries: Entry[] | undefined,
      input: t.StringModuleSpecifier,
    ): t.StringModuleSpecifier | undefined;
  };

  /** Manifest target selecting Deno imports or Node dependency fields. */
  export type TargetFile = 'deno.json' | 'package.json';

  /** Manifest state and diagnostics, which may coexist. */
  export type Result = {
    /** Normalized manifest state, when available. */
    data?: State;
    /** Load, parse, or entry errors; inspect even when `data` is present. */
    error?: t.StdError;
  };

  /** Written manifest and its destination. */
  export type ApplyYamlResult = {
    /** Supplied path, or `./deps.yaml` when omitted. */
    readonly depsFilePath: t.StringPath;
    /** Canonical YAML written to the target. */
    readonly yaml: Yaml;
  };

  /** Written Deno import projection and its destinations. */
  export type ApplyResult = {
    /** Whether imports were written inline or via an import map. */
    readonly kind: TargetKind;
    /** Absolute path of the updated Deno config (`.json` or `.jsonc`). */
    readonly denoFilePath: t.StringPath;
    /** Absolute path that received the import mappings. */
    readonly targetPath: t.StringPath;
    /** Projected mappings; empty when the target's `imports` field is removed. */
    readonly imports: Record<string, t.StringModuleSpecifier>;
  };

  /** Written package dependency fields; empty maps represent removed fields. */
  export type ApplyPackageResult = {
    /** Supplied package target path, without normalization. */
    readonly packageFilePath: t.StringPath;
    /** Runtime dependency mappings. */
    readonly dependencies: Record<string, t.StringSemver>;
    /** Development dependency mappings. */
    readonly devDependencies: Record<string, t.StringSemver>;
    /** Resolver overrides. */
    readonly overrides: t.PkgNodeOverrides;
  };

  /** Options for projecting canonical package policy into `package.json`. */
  export type PackageProjectionOptions = {
    /** Optional package.json resolver policy. */
    readonly packageJson?: PackageJsonPolicy;
  };

  /** YAML options accepted by multi-file projection. */
  export type ApplyFilesYamlOptions = Omit<YamlOptions, 'packageJson'>;

  /** Results returned only after every requested manifest and projection write completes. */
  export type ApplyFilesResult = {
    /** Result from writing deps.yaml. */
    readonly yaml: ApplyYamlResult;
    /** Result from applying projected Deno imports. */
    readonly deno: ApplyResult;
    /** Result from applying projected Node dependencies, when explicitly requested. */
    readonly package?: ApplyPackageResult;
  };

  /** Canonical dependency manifest state. */
  export type State = {
    /** Normalized manifest entries. */
    readonly entries: Entry[];
    /** Parsed ESM module set derived from the entries. */
    readonly modules: t.EsmModules;
    /** Parsed package.json resolver policy. */
    readonly packageJson?: PackageJsonPolicy;
    /** Render this state as YAML, retaining its resolver policy unless overridden. */
    toYaml(options?: YamlOptions): Yaml;
  };

  /** Canonical package.json resolver policy parsed from `deps.yaml`. */
  export type PackageJsonPolicy = {
    /** npm-compatible package override policy. */
    readonly overrides?: t.PkgNodeOverrides;
  };

  /** One manifest as structured data and serialized text. */
  export type Yaml = {
    /** Structured YAML manifest object. */
    readonly obj: YamlShape;
    /** Serialized YAML text. */
    readonly text: t.StringYaml;
    /** Return the same serialized YAML as `text`. */
    toString(): string;
  };

  /** Options passed when rendering `deps.yaml`. */
  export type YamlOptions = {
    /** Optional grouping callback for named dependency groups. */
    groupBy?: CategorizeByGroup;
    /** Optional package.json resolver policy to render. */
    packageJson?: PackageJsonPolicy;
  };

  /** Categorize a dependency into a named group. */
  export type CategorizeByGroup = (args: CategorizeByGroupArgs) => t.IgnoredResult;
  /** Arguments passed to the dependency grouping callback. */
  export type CategorizeByGroupArgs = {
    /** Dependency currently being grouped. */
    entry: Entry;
    /** Projection target currently being rendered. */
    target: TargetFile | TargetFile[];
    /** Assign the dependency to a named YAML group. */
    group(name: string, options?: { subpaths?: t.StringDir[]; dev?: boolean }): void;
  };

  /** One dependency declaration and its projection targets. */
  export type Entry = {
    /** Parsed import identity, version, and optional alias. */
    module: t.EsmParsedImport;

    /** Destinations that consume this declaration. */
    target: TargetFile[];

    /** Additional Deno import subpaths, relative to the dependency root (e.g. `yaml/types`). */
    subpaths?: t.StringDir[];

    /** Select `devDependencies` rather than `dependencies` in `package.json`; ignored by Deno. */
    dev?: boolean;
  };

  /** Structured `deps.yaml` manifest shape. */
  export type YamlShape = {
    /** Reusable named dependency groups. */
    groups?: YamlGroups;
    /** Dependency entries that target `deno.json`. */
    'deno.json'?: YamlEntry[];
    /** Dependency entries that target `package.json`. */
    'package.json'?: YamlEntry[];
  };

  /** Name of a reusable dependency group. */
  export type YamlGroupName = string;
  /** Reusable dependency groups keyed by group name. */
  export type YamlGroups = Record<YamlGroupName, YamlGroup[]>;
  /** Reusable YAML dependency entry stored in a group. */
  export type YamlGroup = Omit<YamlEntry, 'group'>;

  /** A YAML item declaring an import, a group reference, or package resolver overrides. */
  export type YamlEntry = {
    /** Dependency specifier, e.g. `jsr:@std/path@1.0.8` or `npm:rxjs@7`. */
    import?: t.StringModuleSpecifier;

    /** Name of a reusable dependency group to include. */
    group?: YamlGroupName;

    /** Additional Deno import subpaths, relative to the dependency root. */
    subpaths?: t.StringDir[];

    /** Deno import alias in place of the package name. */
    name?: string;

    /** Select `devDependencies` rather than `dependencies` in `package.json`; ignored by Deno. */
    dev?: boolean;

    /** Standalone resolver overrides, allowed only in direct `package.json` items. */
    overrides?: t.PkgNodeOverrides;
  };
}
