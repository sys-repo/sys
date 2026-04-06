import type { t } from './common.ts';

/**
 * Canonical `deps.yaml` manifest helpers for ESM dependencies.
 */
export declare namespace EsmDeps {
  /** Where imports are written when applying deps to a Deno config. */
  export type TargetKind = 'imports' | 'importMap';

  /** Runtime surface for working with canonical dependency manifests. */
  export type Lib = {
    /** Load a dependency manifest from YAML text or path. */
    from(input: t.StringPath | t.StringYaml): Promise<Result>;
    /** Apply Deno imports onto a target `deno.json` or import-map target. */
    applyDeno(path: t.StringPath | undefined, entries?: Entry[]): Promise<ApplyResult>;
    /** Apply package dependencies onto a target `package.json`. */
    applyPackage(
      path: t.StringPath | undefined,
      entries?: Entry[],
    ): Promise<ApplyPackageResult | undefined>;
    /** Write canonical dependency YAML back to a deps.yaml target. */
    applyYaml(
      path: t.StringPath | undefined,
      entries?: Entry[],
      options?: YamlOptions,
    ): Promise<ApplyYamlResult>;
    /** Apply canonical deps to deps.yaml and projected files together. */
    applyFiles(
      input: {
        readonly depsPath?: t.StringPath;
        readonly denoFilePath?: t.StringPath;
        readonly packageFilePath?: t.StringPath;
        readonly yaml?: YamlOptions;
      },
      entries?: Entry[],
    ): Promise<ApplyFilesResult>;
    /** Render manifest entries back to `deps.yaml`. */
    toYaml(entries: Entry[], options?: YamlOptions): Yaml;
    /** Normalize an ESM import into a manifest entry. */
    toEntry(
      module: t.EsmImport | t.StringModuleSpecifier,
      options?: {
        target?: TargetFile | TargetFile[];
        dev?: boolean;
        name?: string;
        subpaths?: t.StringDir[];
      },
    ): Entry;
    /** Find the canonical import for a versionless dependency stem. */
    findImport(
      entries: Entry[] | undefined,
      input: t.StringModuleSpecifier,
    ): t.StringModuleSpecifier | undefined;
  };

  /** Target dependency file kind for generated dependency surfaces. */
  export type TargetFile = 'deno.json' | 'package.json';

  /** Result from loading a dependency manifest. */
  export type Result = {
    /** Parsed dependency manifest state when loading succeeded. */
    data?: State;
    /** Load or parse error when state could not be produced. */
    error?: t.StdError;
  };

  /** Result from writing canonical deps back to a deps.yaml file. */
  export type ApplyYamlResult = {
    /** Resolved deps.yaml file path. */
    readonly depsFilePath: t.StringPath;
    /** Rendered YAML payload written to disk. */
    readonly yaml: Yaml;
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

  /** Result from applying canonical deps to deps.yaml and projected files. */
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
    /** Render the manifest state back to YAML. */
    toYaml(options?: YamlOptions): Yaml;
  };

  /** YAML manifest wrapper. */
  export type Yaml = {
    /** Structured YAML manifest object. */
    readonly obj: YamlShape;
    /** Serialized YAML text. */
    readonly text: t.StringYaml;
    /** Stringify the YAML wrapper. */
    toString(): string;
  };

  /** Options passed when rendering `deps.yaml`. */
  export type YamlOptions = {
    /** Optional grouping callback for named dependency groups. */
    groupBy?: CategorizeByGroup;
  };

  /** Categorize a dependency into a named group. */
  export type CategorizeByGroup = (args: CategorizeByGroupArgs) => t.IgnoredResult;
  /** Arguments passed to the dependency grouping callback. */
  export type CategorizeByGroupArgs = {
    /** Dependency currently being grouped. */
    entry: Entry;
    /** Target file kinds attached to the dependency. */
    target: TargetFile | TargetFile[];
    /** Assign the dependency to a named YAML group. */
    group(name: string, options?: { subpaths?: t.StringDir[]; dev?: boolean }): void;
  };

  /** Canonical dependency manifest entry. */
  export type Entry = {
    /** The parsed ESM import for the dependency. */
    module: t.EsmParsedImport;

    /** File kinds the dependency projects into. */
    target: TargetFile[];

    /**
     * Additional subpaths projected from the dependency root.
     * Example:
     *   `yaml`
     *   `yaml/types`
     */
    subpaths?: t.StringDir[];

    /**
     * Flag indicating the dependency is development-only.
     * Only relevant when projecting to `package.json`.
     */
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

  /** One dependency entry in `deps.yaml`. */
  export type YamlEntry = {
    /**
     * Fully-qualified import specifier.
     * Example:
     *   `jsr:@sys/tmp@0.0.0`
     *   `npm:rxjs@7`
     */
    import?: t.StringModuleSpecifier;

    /** Name of a reusable dependency group to include. */
    group?: YamlGroupName;

    /** Additional subpaths projected from the dependency root. */
    subpaths?: t.StringDir[];

    /** Override alias name when it differs from the import name. */
    name?: string;

    /**
     * Flag indicating the dependency is development-only.
     * Only relevant when projecting to `package.json`.
     */
    dev?: boolean;
  };
}
