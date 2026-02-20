import type { t } from './common.ts';
import type {
  PullToolGithubRelease,
  PullToolGithubReleaseAsset,
  PullToolGithubReleaseResolveResult,
  PullToolGithubReleaseResolved,
} from './u.github/t.ts';

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
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  export type GithubReleaseAsset = PullToolGithubReleaseAsset;
  export type GithubRelease = PullToolGithubRelease;
  export type GithubReleaseResolved = PullToolGithubReleaseResolved;
  export type GithubReleaseResolveResult = PullToolGithubReleaseResolveResult;

  export namespace ConfigYaml {
    export type BundleLocal = {
      dir: t.StringRelativeDir;
      clear?: boolean;
    };

    export type Bundle = HttpBundle | GithubReleaseBundle;
    export type HttpBundle = {
      kind: 'http';
      dist: t.StringUrl;
      local: BundleLocal;
      lastUsedAt?: t.UnixTimestamp;
    };
    export type GithubReleaseBundle = {
      kind: 'github:release';
      repo: string;
      tag?: string;
      asset?: string | string[];
      local: BundleLocal;
      lastUsedAt?: t.UnixTimestamp;
    };

    export type Doc = {
      dir: t.StringDir;
      bundles?: Bundle[];
    };

    export type Location = {
      readonly dir: t.StringDir;
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
  }
}
