import type { t } from './common.ts';

/**
 * The `@sys/tools/serve` type namespace.
 */
export namespace ServeTool {
  export const ID = 'serve' as const;
  export const NAME = 'system/serve:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Public serve helper API. */
  export type Lib = {
    /** Start a static serve target from a directory, config path, or named profile. */
    start(args: StartArgs): Promise<StartResult>;
  };

  /** Programmatic server host policy. */
  export type Host = 'local' | 'network';
  /** Concrete bind hostname derived from the host policy. */
  export type Hostname = '127.0.0.1' | '0.0.0.0';

  export type StartArgs = StartArgsBase & StartSelectorArgs;

  export type StartArgsBase = {
    cwd?: t.StringDir;
    host?: Host;
    /** Use `0` to let the runtime choose an available port. */
    port?: number;
    /** Canonical @sys lifecycle bridge. */
    until?: t.UntilInput;
  };

  export type StartSelectorArgs =
    | StartDirArgs
    | StartConfigArgs
    | StartPathsConfigArgs
    | StartProfileArgs;

  export type StartDirArgs = {
    /** Serve this directory directly, resolved relative to `cwd`. */
    dir: t.StringDir;
    config?: never;
    profile?: never;
    paths?: never;
  };

  /** Owner config refs supplied by programmatic lifecycle callers. */
  export type StartConfigPaths = { config: t.StringPath };
  /** Optional owner config refs for selector alias compatibility. */
  export type StartConfigPathsInput = { config?: t.StringPath };

  export type StartConfigArgs = {
    /** Explicit serve YAML config path. */
    config: t.StringPath;
    /** Equivalent owner config ref; accepted only when it resolves to the same path. */
    paths?: StartConfigPathsInput;
    dir?: never;
    profile?: never;
  };

  export type StartPathsConfigArgs = {
    /** Owner config refs supplied by programmatic lifecycle callers. */
    paths: StartConfigPaths;
    dir?: never;
    config?: never;
    profile?: never;
  };

  export type StartProfileArgs = {
    /** Bare serve config profile name under `-config/@sys.tools.serve`. */
    profile: string;
    dir?: never;
    config?: never;
    paths?: never;
  };

  /** Permissive raw target input used before selector normalization. */
  export type StartTargetPathsInput = { config?: string };

  export type StartTargetInput = {
    dir?: string;
    config?: string;
    profile?: string;
    paths?: StartTargetPathsInput;
  };

  export type StartTargetSelector =
    | { readonly kind: 'dir'; readonly input: string; readonly dir: t.StringDir }
    | { readonly kind: 'config'; readonly config: t.StringPath }
    | { readonly kind: 'profile'; readonly profile: string; readonly config: t.StringPath };

  export type StartTarget = {
    readonly cwd: t.StringDir;
    readonly selector: StartTargetSelector;
    readonly config?: t.StringPath;
    readonly location: LocationYaml.Location;
  };

  export type StartResult = {
    readonly ok: true;
    readonly cwd: t.StringDir;
    readonly selector: StartTargetSelector;
    readonly config?: t.StringPath;
    readonly location: LocationYaml.Location;
    readonly host: Host;
    readonly hostname: Hostname;
    readonly port: number;
    readonly baseUrl: t.StringUrl;
    readonly url: t.StringUrl;
    readonly finished: Promise<void>;
    /** Renderer-neutral service status snapshot. */
    status(): t.Service.Status;
    readonly close: (reason?: unknown) => Promise<void>;
  };

  /** Low-level static server start options. */
  export type StartServerOpts = {
    readonly port?: number;
    readonly host?: Host;
    readonly silent?: boolean;
    readonly keyboard?: boolean;
    readonly until?: t.UntilInput;
  };

  /** Running low-level static server context. */
  export type StartServingContext = {
    readonly location: LocationYaml.Location;
    readonly host: Host;
    readonly hostname: Hostname;
    readonly port: number;
    readonly baseUrl: t.StringUrl;
    readonly url: t.StringUrl;
    readonly server: Deno.HttpServer<Deno.NetAddr>;
    readonly close: (reason?: unknown) => Promise<void>;
  };

  /** Command names. */
  export type Command =
    | 'dir:add'
    | 'dir:remove'
    | 'serve:start/local'
    | 'serve:start/network'
    | 'open'
    | 'reload'
    | 'back'
    | 'exit';
  export type MenuOption = { name: string; value: Command };

  /** Alternative view formats for rendering a route. */
  export type RouteView = 'json';

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs & {
    port?: number;
    dir?: string;
    config?: string;
    profile?: string;
    host?: Host;
    open?: boolean;
    'non-interactive'?: boolean;
  };
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & {
    interactive: boolean;
  };

  /**
   * YAML-authored serve location configuration (authoritative).
   */
  export namespace LocationYaml {
    /**
     * YAML document structure for a serve location.
     */
    export type Doc = {
      /** Display name. */
      name: string;
      /** Directory to serve (relative to CLI cwd, or absolute). */
      dir: t.StringDir;
      /** Extra human-facing server info; path-like values decorate the served URL. */
      info?: Record<string, string>;
    };

    /**
     * Filesystem conventions for serve location YAML storage.
     */
    export type DirName = `-config/${string}.serve`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
    export type LoadResult =
      | { readonly ok: true; readonly cwd: t.StringDir; readonly location: Location }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };

    /**
     * Runtime location with resolved paths.
     */
    export type Location = {
      /** Display name. */
      readonly name: string;
      /** Resolved absolute directory to serve. */
      readonly dir: t.StringDir;
      /** Extra human-facing server info; path-like values decorate the served URL. */
      readonly info?: Record<string, string>;
    };
  }

  /**
   * JSON view outcome for a requestable path.
   */
  export namespace JsonView {
    export type Result = File | Folder;
    export type File = {
      readonly kind: 'file';
      readonly body: {
        mime: t.StringMimeType;
        path: t.StringPath;
        hash: t.StringHash;
        bytes: t.NumberBytes;
      };
    };
    export type Folder = {
      readonly kind: 'folder';
      readonly body: {
        dir: t.StringName;
        files: t.StringName[];
        about: { pkg: t.Pkg; cmd: 'serve' };
      };
    };
  }
}
