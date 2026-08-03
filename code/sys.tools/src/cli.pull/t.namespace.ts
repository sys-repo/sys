import type { t } from './common.ts';

/**
 * Contracts for configured remote materialization and mutable local projections.
 */
export namespace PullTool {
  /**
   * Public API for resolving and executing durable Pull configuration.
   */
  export type Lib = {
    /** Resolve configured mutable outputs without network or filesystem mutation. */
    resolve(config: t.StringPath): Promise<ConfigYaml.Resolved>;

    /** Materialize every bundle in one owner config, throwing at the first failed bundle. */
    run(args: RunArgs): Promise<RunResult>;
  };

  /** Arguments for a programmatic Pull run. */
  export type RunArgs = {
    readonly cwd?: t.StringDir;
    readonly until?: t.UntilInput;
  } & t.Tools.ConfigRefArgs;

  /** Successful result retained for one configured bundle; `run` throws on any bundle failure. */
  export type RunBundleResult =
    | { readonly bundle: ConfigYaml.DistBundle; readonly data: Bundle.Dist.Success }
    | {
      readonly bundle: ConfigYaml.GithubReleaseBundle | ConfigYaml.GithubRepoBundle;
      readonly data: t.GithubPull.Success;
    };

  /** Successful settlement of every bundle in one programmatic Pull run. */
  export type RunResult = {
    readonly ok: true;
    readonly config: t.StringPath;
    readonly cwd: t.StringDir;
    readonly dir: t.StringDir;
    readonly bundles: readonly RunBundleResult[];
  };

  /** Stable Pull registry identifier. */
  export const ID = 'pull' as const;

  /** Stable Pull tool name. */
  export const NAME = 'system/pull:tools' as const;

  /** Pull registry identifier literal. */
  export type Id = typeof ID;

  /** Pull tool-name literal. */
  export type Name = typeof NAME;

  /** Command names. */
  export type MenuCmd =
    | 'config'
    | 'config:edit'
    | 'config:rename'
    | 'bundle:add-dist'
    | 'back'
    | 'exit';
  /** One interactive Pull menu option. */
  export type MenuOption = { readonly name: string; readonly value: MenuCmd };

  /** Supported Pull subcommand. */
  export type CliCommand = 'add';

  /** Raw Pull command-line arguments. */
  export type CliArgs = t.Tools.CliArgs & {
    config?: string;
    manifest?: string;
    integrity?: string;
    store?: string;
    project?: string;
    mode?: t.GithubPull.Mode;
    'dry-run'?: boolean;
    'non-interactive'?: boolean;
  };
  /** Parsed Pull arguments with normalized interaction mode. */
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & {
    readonly command?: CliCommand;
    readonly interactive: boolean;
  };

  /**
   * Execution contracts for one configured remote bundle.
   */
  export namespace Bundle {
    /** Lifecycle and terminal-output options for one bundle. */
    export type RunOptions = {
      readonly silent?: boolean;
      readonly until?: t.UntilInput;
    };

    /**
     * Result truth for one checksum-pinned Dist bundle.
     *
     * `generation` retains Server verification evidence. `projection` reports only mutable-copy
     * settlement and never carries that evidence.
     */
    export namespace Dist {
      /** Complete materialization and projection settlement. */
      export type Result = Success | Failure;

      /** Immutable generation success with either no projection or a completed projection. */
      export type Success = {
        readonly ok: true;
        readonly kind: 'dist';
        readonly generation: t.ServerDist.Existing | t.ServerDist.Promoted;
        readonly projection: Projection.NotRequested | Projection.Success;
      };

      /** Failure in generation materialization or later mutable projection. */
      export type Failure = MaterializationFailure | ProjectionFailure;

      /** Server-owned materialization failed, so projection never acquired authority to run. */
      export type MaterializationFailure = {
        readonly ok: false;
        readonly kind: 'materialization-failed';
        readonly generation: t.ServerDist.Failed;
        readonly projection: Projection.NotRun;
      };

      /** Immutable generation succeeded, but its separate mutable projection failed. */
      export type ProjectionFailure = {
        readonly ok: false;
        readonly kind: 'projection-failed';
        readonly generation: t.ServerDist.Existing | t.ServerDist.Promoted;
        readonly projection: Projection.Failure;
      };

      /**
       * Mutable-copy settlement without generation authority or verification evidence.
       */
      export namespace Projection {
        /** Projection was absent from configuration. */
        export type NotRequested = { readonly kind: 'not-requested' };

        /** Projection could not run because materialization failed. */
        export type NotRun = { readonly kind: 'not-run' };

        /** Mutable local projection completed without inheriting a verification claim. */
        export type Success = {
          readonly kind: 'projected';
          readonly dir: t.StringAbsoluteDir;
          readonly mode: t.GithubPull.Mode;
        };

        /** Projection failed after the immutable generation outcome had settled. */
        export type Failure = {
          readonly kind: 'failed';
          readonly reason:
            | 'invalid-target'
            | 'target-occupied'
            | 'filesystem-failure'
            | 'rewrite-failure'
            | 'cancelled';
          readonly dir: t.StringAbsoluteDir;
          readonly mode: t.GithubPull.Mode;
          readonly error: string;
        };
      }
    }
  }

  /**
   * Strict durable configuration for Dist materialization and generic GitHub pulls.
   *
   * A Dist bundle requires an independently supplied manifest pin and immutable store. Its optional
   * project is a mutable convenience, not artifact authority.
   */
  export namespace ConfigYaml {
    /** Optional mutable copy of an immutable Dist generation. */
    export type DistProject = {
      dir: t.StringRelativeDir;
      mode: t.GithubPull.Mode;
    };

    /** Explicit mutable target for a generic GitHub pull. */
    export type GithubBundleLocal = {
      dir: t.StringRelativeDir;
      mode: t.GithubPull.Mode;
    };

    /** One supported configured remote bundle. */
    export type Bundle = DistBundle | GithubReleaseBundle | GithubRepoBundle;

    /** Checksum-pinned Dist authority and optional mutable projection. */
    export type DistBundle = {
      kind: 'dist';
      manifest: t.StringUrl;
      integrity: t.StringHash;
      store: t.StringRelativeDir;
      project?: DistProject;
    };
    /** Authority shared by bounded generic GitHub bundles. */
    export type GithubBundleBase = {
      repo: string;
      local: GithubBundleLocal;
      limits: t.GithubPull.Limits;
    };
    /** Bounded GitHub release-asset bundle. */
    export type GithubReleaseBundle = GithubBundleBase & {
      kind: 'github:release';
      tag?: string;
      asset?: string | string[];
    };
    /** Bounded GitHub repository-tree bundle. */
    export type GithubRepoBundle = GithubBundleBase & {
      kind: 'github:repo';
      ref?: string;
      path?: string;
    };

    /** Strict YAML document owned by Pull. */
    export type Doc = {
      dir: t.StringDir;
      bundles?: Bundle[];
    };

    /** Validated bundles with their resolved execution root. */
    export type Location = {
      readonly dir: t.StringDir;
      readonly bundles?: Bundle[];
    };

    /** Canonical Pull configuration directory name. */
    export type DirName = `-config/${string}.${Id}`;

    /** Pull configuration filename extension. */
    export type Ext = '.yaml';

    /** Strict YAML validation result. */
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
    /** Pull configuration load result. */
    export type LoadResult =
      | { readonly ok: true; readonly cwd: t.StringDir; readonly location: Location }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };

    /** Resolved mutable output target for a pull bundle. */
    export type ResolvedLocalDir = {
      readonly index: number;
      readonly dir: t.StringRelativeDir;
      readonly path: t.StringDir;
      readonly bundle: Bundle;
    };

    /** Resolved Pull configuration and its mutable output targets. */
    export type Resolved = {
      readonly config: t.StringPath;
      readonly cwd: t.StringDir;
      readonly dir: t.StringDir;
      readonly localDirs: readonly ResolvedLocalDir[];
    };
  }
}
