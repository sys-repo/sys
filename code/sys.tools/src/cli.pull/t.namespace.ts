import { type t } from './common.ts';

/**
 * The Pull type namespace.
 */
export namespace PullTool {
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

  /** Public pull helper API. */
  export type Lib = {
    /** Resolve pull config materialization targets without pulling remote data. */
    resolve(config: t.StringPath): Promise<ConfigYaml.Resolved>;
  };

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
