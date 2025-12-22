import type { t } from './common.ts';

/**
 * Tools for deploying files to a publishing endpoint (CDN).
 */
export namespace DeployTool {
  export type Id = 'deploy';
  export type Name = 'system/deploy:tools';

  /** Command names. */
  export type Command = 'back' | 'exit';
  export type MenuOption = { name: string; value: Command };

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

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
      export type SourceMode = 'copy' | 'build+copy';

      /**
       * Maps an input directory into the generated endpoint staging dir.
       * (Source may be absolute or relative; resolution rules are handled by runtime.)
       */
      export type Mapping = {
        dir: { source: t.StringDir; staging: '.' | t.StringPath };
        mode: SourceMode;
      };

      /**
       * Endpoint staging root.
       * All mapping `dir.staging` paths are resolved relative to this directory.
       */
      export type Staging = {
        /** Root directory for staging (relative to deploy cwd). */
        dir: t.StringPath;
      };

      export type Doc = {
        /** Optional provider adapter config. */
        provider?: Provider.All;

        /** Staging root for this endpoint. */
        staging?: Staging;

        /** Directory mappings assembled into this endpoint. */
        mappings?: readonly Mapping[];
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
     * At present, only the `orbiter` provider is defined.
     */
    export namespace Provider {
      /**
       * Tagged union of all supported provider configs.
       * Add new providers here (and in u.providers schemas) as they land.
       */
      export type All = Orbiter | t.NoopProvider; // ...S3, etc.
      export type Orbiter = t.OrbiterProvider; // IPFS
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
      export type DirName = '-endpoints';
      export type Ext = '.yaml';
      export type YamlCheck =
        | { readonly ok: true; readonly doc: t.DeployTool.Config.EndpointYaml.Doc }
        | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
    }

    export namespace Menu {
      export type Action = 'stage' | 'push' | 'edit' | 'fix' | 'rename' | 'delete' | 'back';
      export type Option = { readonly name: string; readonly value: Action };
    }
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
      | { readonly mode: 'build+copy'; readonly dir: Dir };

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
