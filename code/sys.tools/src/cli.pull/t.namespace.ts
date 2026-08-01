import { type t } from './common.ts';

/**
 * The Pull type namespace.
 */
export namespace PullTool {
  /** Public pull helper API. */
  export type Lib = {
    /** Resolve pull config materialization targets without pulling remote data. */
    resolve(config: t.StringPath): Promise<ConfigYaml.Resolved>;

    /** Pull configured remote bundles from owner YAML. */
    run(args: RunArgs): Promise<RunResult>;
  };

  /** Arguments for a programmatic Pull run. */
  export type RunArgs = {
    readonly cwd?: t.StringDir;
  } & t.Tools.ConfigRefArgs;

  /** Result for one configured bundle. */
  export type RunBundleResult = {
    readonly bundle: ConfigYaml.Bundle;
    readonly data: Bundle.Result;
  };

  /** Result from a programmatic Pull run. */
  export type RunResult = {
    readonly ok: true;
    readonly config: t.StringPath;
    readonly cwd: t.StringDir;
    readonly dir: t.StringDir;
    readonly bundles: readonly RunBundleResult[];
  };

  export const ID = 'pull' as const;
  export const NAME = 'system/pull:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command names. */
  export type MenuCmd =
    | 'config'
    | 'config:edit'
    | 'config:rename'
    | 'bundle:add-remote'
    | 'bundle:pull-latest'
    | 'back'
    | 'exit';
  export type MenuOption = { readonly name: string; readonly value: MenuCmd };

  /** Command line arguments (argv). */
  export type CliCommand = 'add';
  export type CliArgs = t.Tools.CliArgs & {
    config?: string;
    dist?: string;
    local?: string;
    'dry-run'?: boolean;
    'non-interactive'?: boolean;
  };
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & {
    readonly command?: CliCommand;
    readonly interactive: boolean;
  };

  export type GithubReleaseAsset = t.GithubSource.ReleaseAsset;
  export type GithubRelease = t.GithubSource.Release;
  export type GithubReleaseResolved = t.GithubSource.ReleaseResolved;
  export type GithubReleaseResolveResult = t.GithubSource.ReleaseResolveResult;
  export type GithubRepoMetadata = t.GithubSource.RepoMetadata;
  export type GithubRepoCommit = t.GithubSource.RepoCommit;
  export type GithubRepoTreeEntry = t.GithubSource.RepoTreeEntry;
  export type GithubRepoTree = t.GithubSource.RepoTree;
  export type GithubRepoResolvedEntry = t.GithubSource.RepoResolvedEntry;
  export type GithubRepoResolved = t.GithubSource.RepoResolved;
  export type GithubRepoResolveResult = t.GithubSource.RepoResolveResult;

  /**
   * Bundle-pull contracts.
   */
  export namespace Bundle {
    /** Result from a bundle-pull operation. */
    export type Result = ResultSuccess | ResultFailure;

    type ResultMeta = {
      dist?: t.DistPkg;
      dists?: readonly t.DistPkg[];
      summary?: SummaryMeta;
    };

    /** Successful bundle-pull result. */
    export type ResultSuccess = ResultMeta & {
      readonly ok: true;
      readonly ops: readonly RecordSuccess[];
    };

    /** Failed bundle-pull result. */
    export type ResultFailure = ResultMeta & {
      readonly ok: false;
      readonly ops: readonly Record[];
    };

    /** Bundle-pull operation record. */
    export type Record = RecordSuccess | RecordFailure;

    type RecordCommon = {
      readonly path: { readonly source: t.StringUrl; readonly target: t.StringPath };
    };

    /** Successful bundle-pull operation record. */
    export type RecordSuccess = RecordCommon & {
      readonly ok: true;
      readonly status?: t.HttpStatusCode;
      readonly bytes: t.NumberBytes;
      readonly error?: undefined;
    };

    /** Failed bundle-pull operation record. */
    export type RecordFailure = RecordCommon & {
      readonly ok: false;
      readonly status?: t.HttpStatusCode;
      readonly bytes?: undefined;
      readonly error: string;
    };

    /** Metadata rendered in a bundle-pull summary. */
    export type SummaryMeta =
      | { readonly kind: 'http'; readonly source: t.StringUrl }
      | { readonly kind: 'github:release'; readonly repo: string; readonly release: string }
      | {
        readonly kind: 'github:repo';
        readonly repo: string;
        readonly ref: string;
        readonly path?: string;
      };

    /**
     * Remote bundle-pull contracts.
     */
    export namespace Remote {
      /** Result from a remote bundle pull. */
      export type Result =
        | { readonly ok: true; readonly data: Bundle.Result }
        | { readonly ok: false; readonly error: string };
    }

    /** Options for running a bundle pull. */
    export type RunOptions = {
      readonly silent?: boolean;
    };
  }

  /**
   * Pull configuration contracts.
   */
  export namespace ConfigYaml {
    export type Defaults = {
      local?: {
        clear?: boolean;
      };
    };

    export type BundleLocal = {
      dir: t.StringRelativeDir;
      clear?: boolean;
    };

    export type Bundle = HttpBundle | GithubReleaseBundle | GithubRepoBundle;
    export type HttpBundle = {
      kind: 'http';
      dist: t.StringUrl;
      local: BundleLocal;
      lastUsedAt?: t.UnixTimestamp;
    };
    export type GithubBundleBase = {
      repo: string;
      local: BundleLocal;
      lastUsedAt?: t.UnixTimestamp;
    };
    export type GithubReleaseBundle = GithubBundleBase & {
      kind: 'github:release';
      tag?: string;
      asset?: string | string[];
    };
    export type GithubRepoBundle = GithubBundleBase & {
      kind: 'github:repo';
      ref?: string;
      path?: string;
    };

    export type Doc = {
      dir: t.StringDir;
      defaults?: Defaults;
      bundles?: Bundle[];
    };

    export type Location = {
      readonly dir: t.StringDir;
      readonly defaults?: Defaults;
      readonly bundles?: Bundle[];
    };

    export type DirName = `-config/${string}.${Id}`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
    export type LoadResult =
      | { readonly ok: true; readonly cwd: t.StringDir; readonly location: Location }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };

    /** Resolved local materialization target for a pull bundle. */
    export type ResolvedLocalDir = {
      readonly index: number;
      readonly dir: t.StringRelativeDir;
      readonly path: t.StringDir;
      readonly bundle: Bundle;
    };

    /** Resolved pull config materialization targets. */
    export type Resolved = {
      readonly config: t.StringPath;
      readonly cwd: t.StringDir;
      readonly dir: t.StringDir;
      readonly localDirs: readonly ResolvedLocalDir[];
    };
  }
}
