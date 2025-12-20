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
      /** Remembered endpoints. */
      endpoints?: readonly Endpoint[];
    };

    /**
     * Canonical per-mapping behavior.
     * - 'build+copy' → build first, then copy output
     * - 'copy'       → copy as-is
     */
    export type SourceMode = 'copy' | 'build+copy';

    /**
     * One publishable endpoint unit (single CDN bucket target).
     * The staging dir is derived from `name`.
     */
    export type Endpoint = t.Tools.Recency & {
      /** Stable, unique endpoint name (menu key + staging identity). */
      name: string;
      /** Directory mappings assembled into this endpoint. */
      mappings: Mapping[];
      /** Optional provider adapter config. */
      provider?: t.DeployProvider;
    };

    /**
     * Maps an input directory into the generated endpoint staging dir.
     */
    export type Mapping = {
      dir: {
        /** Input directory. May be absolute or relative (resolved by the tool). */
        source: t.StringDir;
        /** Destination within the endpoint staging dir. Use '.' to mean "staging root". */
        staging: '.' | t.StringPath;
      };

      /** Whether this mapping requires a build step before copy. */
      mode: SourceMode;
    };
  }
}
