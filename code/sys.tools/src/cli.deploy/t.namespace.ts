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
  export type MenuOption = { name: string; value: Command };

  /** Command line arguments (argv). */
  export type CliAction = 'stage' | 'push' | 'stage+push';
  export type CliArgs = t.Tools.CliArgs & {
    config?: string;
    action?: CliAction;
    'no-interactive'?: boolean;
  };
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & {
    interactive: boolean;
  };

  export namespace Config {
    export type File = t.JsonFile<Doc>;
    export type Doc = t.JsonFileDoc & {
      name: string;
      /**
       * Thin index:
       * - recency metadata for ordering
       * - stable endpoint name
       * - relative YAML file path (authority lives in YAML)
       */
      endpoints?: readonly EndpointRef[];
    };

    /**
     * An endpoint reference tracked in config.json for recency + lookup.
     * The endpoint's actual configuration is authored in YAML.
     */
    export type EndpointRef = t.Tools.Recency & {
      /** Stable, unique endpoint name (menu key). */
      name: string;
      /** Relative path to the YAML file (from the CLI cwd). */
      file: t.StringPath;
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
       * Maps an input directory into the generated endpoint staging dir.
       * (Source may be absolute or relative; resolution rules are handled by runtime.)
       */
      export type Mapping = {
        dir: { source: t.StringDir; staging: '.' | t.StringPath };
        mode: SourceMode;
        /**
         * Optional shard expansion for template paths.
         * When provided and templates are present, mappings are expanded per shard.
         */
        shards?: { total: number; requireAll?: boolean };
      };

      /**
       * Singular Deno package-target selection.
       *
       * Deno stages one selected target into one staged root, so no mapping
       * mode discriminator or array fan-in is needed.
       */
      export type DenoMapping = {
        dir: { source: t.StringDir; staging: '.' | t.StringPath };
      };

      /**
       * Endpoint staging root.
       * All mapping `dir.staging` paths are resolved relative to this directory.
       */
      export type Staging = {
        /** Root directory for staging (relative to deploy cwd). */
        dir: t.StringPath;
        /** When true, clears staging targets before running mappings. */
        clear?: boolean;
        /** Optional HTML staging policies. */
        html?: {
          /** When true, inject/update x-build-reset metadata in staged index.html files. */
          buildReset?: boolean;
        };
      };

      /**
       * Endpoint source root.
       * Mapping `dir.source` values are resolved relative to this directory.
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

        /** Staging root for this endpoint. */
        staging?: Staging;

        /** Directory mappings assembled into this endpoint. */
        mappings?: readonly Mapping[];

        /** Singular Deno package-target mapping. */
        mapping?: DenoMapping;
      };
    }

    /**
     * Deployment provider configuration.
     *
     * A DeployProvider describes the *remote system* an endpoint is published to.
     * It is intentionally a tagged union (`kind`) so:
     * - schemas can discriminate cleanly
     * - validation errors are precise
     * - new providers can be added without breaking existing configs
     *
     * Provider objects are authored inside endpoint YAML files and validated
     * strictly at runtime. Unknown providers should fail validation once the
     * provider surface is tightened.
     *
     * Current providers:
     * - `orbiter`
     * - `deno`
     * - `noop`
     */
    export namespace Provider {
      /**
       * Tagged union of all supported provider configs.
       * Add new providers here (and in u.providers schemas) as they land.
       */
      export type All = Orbiter | Deno | t.NoopProvider; // ...S3, etc.
      export type Orbiter = t.OrbiterProvider; // IPFS
      export type Deno = t.DenoProvider;
      export type Noop = t.NoopProvider;
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
        readonly shards?: number;
        readonly bytes?: number;
      };
      readonly error?: unknown;
    };
  }

  export namespace Staging {
    /**
     * Source → staging directory mapping.
     * - `source` is an absolute or cwd-relative directory
     * - `staging` is a relative path under the staging root
     */
    export type Dir = {
      readonly source: t.StringDir;
      readonly staging: t.StringRelativeDir;
    };

    /**
     * Staging operation.
     * - `copy`: copy source directly into staging
     * - `build+copy`: build source, then copy build output into staging
     */
    export type Mapping =
      | { readonly mode: 'copy'; readonly dir: Dir }
      | { readonly mode: 'build+copy'; readonly dir: Dir }
      | { readonly mode: 'index'; readonly dir: Dir };

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
