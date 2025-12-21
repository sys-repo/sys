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

  /**
   * Filesystem conventions for endpoint YAML storage.
   * - Root dir is relative to the CLI cwd.
   * - Each endpoint is one YAML file named "<name>.yaml".
   */
  export namespace EndpointsFs {
    export type DirName = '-endpoints';
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: t.DeployTool.Config.EndpointYaml.Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
  }

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

      export type Doc = {
        /** Optional provider adapter config. */
        provider?: t.DeployProvider;
        /** Directory mappings assembled into this endpoint. */
        mappings?: Mapping[];
      };
    }
  }
}
