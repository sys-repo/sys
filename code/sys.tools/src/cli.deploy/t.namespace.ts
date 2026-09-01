import type { t } from './common.ts';

/**
 * Tools for deploying files to a publishing endpoint (CDN).
 */
export namespace DeployTool {
  export const ID = 'deploy' as const;
  export const NAME = 'system/deploy:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command names. */
  export type Command = 'back' | 'exit';
  export type MenuOption = { readonly name: string; readonly value: Command };

  /** Command line arguments (argv). */
  export type CliAction = 'stage' | 'push' | 'stage+push';
  export type CliArgs = t.Tools.CliArgs & {
    config?: string;
    action?: CliAction;
    'non-interactive'?: boolean;
    /** Force push repair mode: rewrite staged publish files even when remote manifests match. */
    force?: boolean;
  };
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & {
    readonly interactive: boolean;
  };

  /** Public deploy helper API. */
  export type Lib = {
    /** Stage endpoint files from owner YAML. */
    stage(args: StageArgs): Promise<StageResult>;
    /** Push an already-staged endpoint from owner YAML. */
    push(args: PushArgs): Promise<PushResult>;
  };

  /** Inputs accepted by `Deploy.stage`. */
  export type StageArgs = {
    cwd?: t.StringDir;
    /** Cancel staging and settle any owned build child before releasing authority. */
    until?: t.UntilInput;
  } & t.Tools.ConfigRefArgs;

  /** Inputs accepted by `Deploy.push`. */
  export type PushArgs = {
    cwd?: t.StringDir;
    /** Rewrite staged publish files even when the remote manifest says they are unchanged. */
    force?: boolean;
  } & t.Tools.ConfigRefArgs;

  /** Successful staging result. */
  export type StageResult = {
    readonly ok: true;
    readonly config: t.StringPath;
    readonly cwd: t.StringDir;
    readonly stagingRoot: t.StringAbsoluteDir;
    /** Immutable evidence for the exact root Dist completed by this operation. */
    readonly verification: t.Pkg.Dist.Local.Verify.Evidence;
  };

  /** Successful publication result. */
  export type PushResult = {
    readonly ok: true;
    readonly cwd: t.StringDir;
    readonly config: t.StringPath;
    readonly targets: number;
    readonly elapsed?: string;
    readonly bytes?: number;
    /** Provider-reported per-file publish details when available. */
    readonly publish?: t.PushPublishStats;
    /** Provider-reported stale-file removals when available. */
    readonly prune?: t.PushPruneStats;
  };

  /**
   * Non-throwing staging operation results.
   */
  export namespace StageOperation {
    /** Staging success or expected failure. */
    export type Result = StageResult | Failure;

    /** Expected staging failure. */
    export type Failure = {
      readonly ok: false;
      readonly config: t.StringPath;
      readonly cwd: t.StringDir;
      readonly stagingRoot?: t.StringAbsoluteDir;
      readonly error?: unknown;
    };
  }

  /**
   * Non-throwing publication operation results.
   */
  export namespace PushOperation {
    /** Publication success or expected failure. */
    export type Result = PushResult | Failure;

    /** Expected publication failure. */
    export type Failure = {
      readonly ok: false;
      readonly cwd: t.StringDir;
      readonly config: t.StringPath;
      readonly reason:
        | 'yaml-invalid'
        | 'no-provider'
        | 'no-push-targets'
        | 'no-staging-output'
        | 'failed';
      readonly hint?: string;
      readonly target?: t.PushTargetContext;
      readonly missing?: readonly t.PushMissingTarget[];
      readonly error?: unknown;
    };
  }

  export namespace Config {
    export type File = t.JsonFile.Instance<Doc>;
    export type Doc = t.JsonFile.Doc & {
      readonly name: string;
      /**
       * Thin index:
       * - recency metadata for ordering
       * - stable endpoint name
       * - relative YAML file path (authority lives in YAML)
       */
      readonly endpoints?: readonly EndpointRef[];
    };

    /**
     * An endpoint reference tracked in config.json for recency + lookup.
     * The endpoint's actual configuration is authored in YAML.
     */
    export type EndpointRef = t.Tools.Recency & {
      /** Stable, unique endpoint name (menu key). */
      readonly name: string;
      /** Relative path to the YAML file (from the CLI cwd). */
      readonly file: t.StringPath;
    };

    /**
     * YAML-authored endpoint configuration (authoritative).
     * (We keep these types here so callers can share the same vocabulary.)
     */
    export namespace EndpointYaml {
      /**
       * Canonical per-mapping behavior.
       * - 'build+copy' → build first, then copy output
       * - 'copy'       → copy as-is
       */
      export type SourceMode = 'copy' | 'build+copy' | 'index';

      /**
       * Maps one directory into the generated endpoint staging dir.
       * Copy/build sources resolve from `source.dir`; index sources resolve from `staging.dir`
       * after standard mappings complete.
       */
      export type Mapping = {
        dir: {
          source: t.StringDir;
          staging: '.' | t.StringPath;
        };
        mode: SourceMode;
        /**
         * Optional shard expansion for template paths.
         * When provided and templates are present, mappings are expanded per shard.
         */
        shards?: {
          /** Positive safe-integer number of template expansions. */
          total: number;
          /** Require every expanded source path to exist. */
          requireAll?: boolean;
        };
      };

      /**
       * Endpoint staging root.
       * All mapping `dir.staging` paths are resolved relative to this directory.
       */
      export type Staging = {
        /** Dedicated operation-owned root directory relative to deploy cwd. */
        dir: t.StringPath;
        /** Optional local serve configuration for staged endpoint sanity checks. */
        serve?: {
          /** Port used by the local staged static server. */
          port?: number;
        };
        /** Optional HTML staging policies. */
        html?: {
          /** When true, inject/update x-build-reset metadata in staged index.html files. */
          buildReset?: boolean;
        };
      };

      /**
       * Endpoint source root.
       * Copy/build `dir.source` values are resolved relative to this directory; index sources are
       * staging-root relative.
       */
      export type Source = {
        /** Root directory for sources (relative to deploy cwd). */
        dir: t.StringPath;
      };

      export type Doc = {
        /** Optional provider adapter config. */
        provider?: Provider.All;

        /** Source root for this endpoint. */
        source?: Source;

        /** Required dedicated staging root for this endpoint. */
        staging: Staging;

        /** Directory mappings assembled into this endpoint. */
        mappings?: Mapping[];
      };
    }

    /**
     * Strict provider configuration authored inside endpoint YAML.
     *
     * Supported providers:
     * - `noop` → inert, with no publication target
     * - `r2` → Cloudflare R2 publication
     */
    export namespace Provider {
      /**
       * Tagged union of all supported provider configs.
       * Add new providers here (and in u.providers schemas) as they land.
       */
      export type All = Noop | R2;
      /** Inert provider configuration. */
      export type Noop = t.NoopProvider;
      /** Cloudflare R2 provider configuration. */
      export type R2 = t.R2Provider;
    }
  }

  export namespace Endpoint {
    /**
     * Filesystem conventions for endpoint YAML storage.
     * - Root dir is relative to the CLI cwd.
     * - Each endpoint is one YAML file named "<name>.yaml".
     */
    export namespace Fs {
      export type DirName = `-config/${string}.deploy`;
      export type Ext = '.yaml';
      export type YamlCheck =
        | { readonly ok: true; readonly doc: t.DeployTool.Config.EndpointYaml.Doc }
        | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
    }

    export namespace Menu {
      export type Action =
        | 'stage'
        | 'push'
        | 'stage-push'
        | 'serve'
        | 'edit'
        | 'reload'
        | 'fix'
        | 'rename'
        | 'delete'
        | 'back';
      export type Option = { readonly name: string; readonly value: Action };
    }

    export type RunAction = Extract<Menu.Action, 'stage' | 'push' | 'stage-push' | 'serve'>;
    export type RunResult = {
      readonly ok: boolean;
      readonly stageOk?: boolean;
      readonly push?: {
        readonly ok: boolean;
        readonly elapsed?: string;
        readonly bytes?: number;
        /** Provider-reported per-file publish details when available. */
        readonly publish?: t.PushPublishStats;
        /** Provider-reported stale-file removals when available. */
        readonly prune?: t.PushPruneStats;
      };
      readonly error?: unknown;
    };
  }

  export namespace Staging {
    /** Stable canonical identity captured for one staging directory. */
    export type DirectoryIdentity = {
      readonly path: t.StringAbsoluteDir;
      readonly device: number;
      readonly inode: number;
    };

    /**
     * Source → staging directory mapping.
     * Copy/build sources resolve from the configured source root; index sources resolve from the
     * staging root. Destinations are authored staging-root relative. Preflight resolves and admits
     * every path before execution.
     */
    export type Dir = {
      source: t.StringDir;
      staging: t.StringRelativeDir;
    };

    /**
     * Staging operation.
     * - `copy`: copy source directly into staging
     * - `build+copy`: build source, then copy build output into staging
     */
    export type Mapping =
      | { mode: 'copy'; dir: Dir }
      | { mode: 'build+copy'; dir: Dir }
      | { mode: 'index'; dir: Dir };

    /** Build progress. */
    export type ProgressKind = 'mapping:start' | 'mapping:step' | 'mapping:done' | 'mapping:fail';
    export type ProgressReport<K extends ProgressKind> = {
      readonly kind: K;
      readonly label: string;
    };
    export type ProgressEvent = {
      readonly kind: ProgressKind;
      readonly index: number;
      readonly total: number;
      readonly mode: t.DeployTool.Staging.Mapping['mode'];
      readonly source: t.StringPath;
      readonly staging: t.StringPath;
      readonly label?: string;
      readonly error?: unknown;
    };
  }
}
