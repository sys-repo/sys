import type { t } from './common.ts';

/**
 * Profile YAML contracts for running Pi as a system agent.
 */
export declare namespace PiCliProfiles {
  /** Runtime surface for the profile-driven Pi launcher. */
  export type Lib = {
    /** Parse wrapper args, optionally show help, then launch or open the profile menu. */
    main(input?: Input): Promise<Result>;
    /** Run Pi from a concrete profile config. */
    run(args: RunArgs): Promise<t.Process.InheritOutput>;
    /** Open the profile config menu. */
    menu(args: MenuArgs): Promise<MenuResult>;
  };

  /** Profile boundary entry input. */
  export type Input = {
    /** Boundary argv; args after `--` pass through to Pi. */
    readonly argv?: readonly string[];
    /** Terminal working directory used to resolve profile paths. */
    readonly cwd?: t.StringDir | t.PiCli.Cwd;
    /** Environment overrides passed to the Pi process. */
    readonly env?: Record<string, string>;
    /** Unsafe debug escape hatch: launch the Pi child with Deno full permissions. */
    readonly allowAll?: boolean;
    /** Extra read-scope paths added to the Pi sandbox. */
    readonly read?: readonly t.StringPath[];
    /** Extra write-scope paths added to the Pi sandbox. */
    readonly write?: readonly t.StringPath[];
    /** Pi package specifier override, primarily for tests and pinned launchers. */
    readonly pkg?: t.StringModuleSpecifier;
  };

  /** Concrete run request after startup cwd resolution. */
  export type RunArgs = {
    /** Git-rooted cwd contract already resolved by startup. */
    readonly cwd: t.PiCli.Cwd;
    /** Profile config YAML file. */
    readonly config: t.StringPath;
    /** Extra Pi args appended at invocation time. */
    readonly args?: readonly string[];
    /** Environment overrides merged over profile env. */
    readonly env?: Record<string, string>;
    /** Unsafe debug escape hatch: launch the Pi child with Deno full permissions. */
    readonly allowAll?: boolean;
    /** Extra read-scope paths merged with profile read scope. */
    readonly read?: readonly t.StringPath[];
    /** Extra write-scope paths merged with profile write scope. */
    readonly write?: readonly t.StringPath[];
    /** Pi package specifier override, primarily for tests and pinned launchers. */
    readonly pkg?: t.StringModuleSpecifier;
  };

  /** Menu input. */
  export type MenuArgs = {
    /** Terminal working directory used to locate profile configs. */
    readonly cwd: t.StringDir;
    /** Unsafe debug escape hatch applied to sandbox previews from the menu. */
    readonly allowAll?: boolean;
  };

  /** Parsed boundary args. */
  export type ParsedArgs = {
    readonly help?: boolean;
    readonly allowAll?: boolean;
    readonly nonInteractive?: boolean;
    readonly config?: string;
    readonly profile?: string;
    readonly gitRoot?: t.PiCli.GitRootMode;
    /** Pi args captured after `--`. */
    readonly _: readonly string[];
  };

  /** Profile launcher result. */
  export type Result = Help | Ran | Exit;

  /** Help output result. */
  export type Help = {
    readonly kind: 'help';
    readonly input: Input;
    readonly text: string;
  };

  /** Successful launch result. */
  export type Ran = {
    readonly kind: 'run';
    readonly input: Input;
    readonly parsed: ParsedArgs;
    readonly output: t.Process.InheritOutput;
  };

  /** User exited the profile menu without launching. */
  export type Exit = {
    readonly kind: 'exit';
    readonly input: Input;
  };

  /** Profile menu result. */
  export type MenuResult =
    | { readonly kind: 'exit' }
    | { readonly kind: 'selected'; readonly config: t.StringPath; readonly previewed?: boolean };

  /** Sandbox policy for a Pi profile. */
  export type Sandbox = {
    /** Capabilities granted to Pi. */
    readonly capability?: Sandbox.Capability;
    /** Intentional context made visible to Pi. */
    readonly context?: Sandbox.Context;
  };

  /** Sandbox policy helper types. */
  export namespace Sandbox {
    /** Filesystem and process capabilities granted to Pi. */
    export type Capability = {
      /** Extra readable paths beyond the default launcher scope. */
      readonly read?: readonly t.StringPath[];
      /** Extra writable paths beyond the default launcher scope. */
      readonly write?: readonly t.StringPath[];
      /** Extra environment variables passed to Pi. */
      readonly env?: Record<string, string>;
    };

    /** Guidance and instruction sources intentionally injected into Pi's prompt. */
    export type Context = {
      /** Extra guidance files loaded after standard project-root context. */
      readonly append?: readonly t.StringPath[];
    };
  }

  /** Prompt policy for a Pi profile. */
  export type Prompt = {
    /**
     * System prompt policy.
     *
     * - omitted or `null` selects the wrapper-owned `DEFAULT_SYSTEM_PROMPT`.
     * - `string` passes that explicit replacement to Pi.
     */
    readonly system?: string | null;
  };

  /** Persisted YAML document types. */
  export namespace Yaml {
    /** Canonical config directory shape. */
    export type DirName = `-config/${string}`;
    /** Profile config file extension. */
    export type Ext = '.yaml';

    /** YAML document persisted per profile config file. */
    export type Profile = {
      /** Optional prompt override policy for this profile. */
      readonly prompt?: PiCliProfiles.Prompt;
      /** Explicit sandbox policy for this profile. */
      readonly sandbox?: PiCliProfiles.Sandbox;
    };

    /** YAML validation result. */
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Profile }
      | { readonly ok: false; readonly errors: readonly unknown[] };
  }
}
