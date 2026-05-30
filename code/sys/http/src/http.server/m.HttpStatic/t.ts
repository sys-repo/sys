import type { t } from './common.ts';

/**
 * Static HTTP server lifecycle endpoint.
 */
export declare namespace HttpStatic {
  /** Public static-server lifecycle API. */
  export type Lib = t.Service.LifecycleEndpoint<StartArgs | undefined, t.HttpServer.Started> & {
    /** Declare configured static-server resources without starting the service. */
    resources(args: t.Service.Resource.Args): Promise<readonly t.Service.Resource.Any[]>;

    /** Start a static file server and return the standard HTTP server lifecycle handle. */
    start(args?: StartArgs): Promise<t.HttpServer.Started>;

    /** Durable static-server config owner affordances. */
    readonly Config: ConfigLib;
  };

  /** Durable static-server config owner affordances. */
  export type ConfigLib = {
    /** Create or update a static-server config YAML document. */
    add(input: ConfigAddInput): Promise<ConfigAddResult>;
  };

  /** Durable YAML shape owned by the static-server endpoint. */
  export type ConfigDoc = {
    /** Display name forwarded to static server startup output. */
    readonly name: string;

    /** Static root to serve. Relative paths resolve against the service cwd. */
    readonly dir: string;

    /** Listen hostname. */
    readonly hostname: string;

    /** Listen port. Use `0` for an ephemeral port. */
    readonly port: number;

    /** Suppress startup output when this config is used as a lifecycle ref. */
    readonly silent?: boolean;
  };

  /** Config mutation input. */
  export type ConfigAddInput = {
    /** Base directory used to resolve relative `config` paths. */
    readonly cwd: t.StringDir;

    /** Static config ref: bare name or explicit YAML path. */
    readonly config?: string;

    /** Static server display name. Defaults from `config`. */
    readonly name?: string;

    /** Static root to serve. */
    readonly dir?: string;

    /** Listen hostname. */
    readonly hostname?: string;

    /** Listen port. */
    readonly port?: number | string;

    /** Preview the config mutation without writing. */
    readonly dryRun?: boolean;
  };

  /** Config mutation result. */
  export type ConfigAddResult = {
    /** Result kind. */
    readonly kind: 'added' | 'updated' | 'exists' | 'dry-run';

    /** Resolved config YAML path. */
    readonly yamlPath: t.StringPath;

    /** Whether the file did not exist before the mutation. */
    readonly created: boolean;

    /** Desired durable config document. */
    readonly config: ConfigDoc;
  };

  /** Arguments passed to [HttpStatic.start]. */
  export type StartArgs = {
    /** Base directory used to resolve relative `dir` and config refs. Defaults to the process cwd. */
    cwd?: string;

    /** Config refs resolved by the caller and interpreted by this endpoint. */
    paths?: { readonly config?: t.StringPath };

    /** Static root to serve. Relative paths resolve against `cwd`. Defaults to `.`. */
    dir?: string;

    /** Listen hostname. Defaults to the underlying HTTP server convention. */
    hostname?: string;

    /** Listen port. Use `0` for an ephemeral port. */
    port?: number;

    /** Suppress startup output. */
    silent?: boolean;

    /** Enable existing HTTP server keyboard handling. */
    keyboard?: boolean | t.HttpServer.Start.Keyboard.Options;

    /** Display name forwarded to the HTTP server startup output. */
    name?: string;

    /** Extra owner facts; path-like values are exposed as requestable URLs. */
    info?: Record<string, string>;

    /** Canonical @sys lifecycle bridge. */
    until?: t.UntilInput;
  };
}
