import type { t } from './common.ts';

/**
 * Persisted environment profiles for Pi.
 */
export declare namespace PiCliProfiles {
  /** Runtime surface for the persisted profile launcher. */
  export type Lib = {
    /** Parse wrapper args, optionally show help, then launch or open the profile menu. */
    main(input?: Input): Promise<Result>;
    /** Run Pi from a concrete environment profile config. */
    run(args: RunArgs): Promise<t.Process.InheritOutput>;
    /** Open the environment profile config menu. */
    menu(args: MenuArgs): Promise<MenuResult>;
  };

  /** Wrapper entry input. */
  export type Input = {
    /** Wrapper argv; args after `--` pass through to Pi. */
    readonly argv?: readonly string[];
    /** Terminal working directory used to resolve profile paths. */
    readonly cwd?: t.StringDir;
    /** Environment overrides passed to the Pi process. */
    readonly env?: Record<string, string>;
    /** Extra read-scope paths added to the Pi sandbox. */
    readonly read?: readonly t.StringPath[];
    /** Pi package specifier override, primarily for tests and pinned launchers. */
    readonly pkg?: t.StringModuleSpecifier;
  };

  /** Concrete run request after profile selection. */
  export type RunArgs = {
    /** Terminal working directory used to resolve profile paths. */
    readonly cwd?: t.StringDir;
    /** Environment profile YAML file. */
    readonly config: t.StringPath;
    /** Named profile inside the config; defaults to `default`, then first profile. */
    readonly profile?: string;
    /** Extra Pi args appended after profile args. */
    readonly args?: readonly string[];
    /** Environment overrides merged over profile env. */
    readonly env?: Record<string, string>;
    /** Extra read-scope paths merged with profile read scope. */
    readonly read?: readonly t.StringPath[];
    /** Pi package specifier override, primarily for tests and pinned launchers. */
    readonly pkg?: t.StringModuleSpecifier;
  };

  /** Menu input. */
  export type MenuArgs = {
    /** Terminal working directory used to locate profile configs. */
    readonly cwd: t.StringDir;
  };

  /** Parsed wrapper args. */
  export type ParsedArgs = {
    readonly help?: boolean;
    readonly config?: string;
    readonly profile?: string;
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
    | { readonly kind: 'selected'; readonly config: t.StringPath; readonly profile: string };

  /** Persisted YAML document types. */
  export namespace Yaml {
    /** Canonical config directory shape. */
    export type DirName = `-config/${string}.pi.cli`;
    /** Environment profile file extension. */
    export type Ext = '.yaml';

    /** YAML document persisted per environment profile file. */
    export type ProfileSet = {
      /** Named profiles available in this file. */
      readonly profiles: readonly Profile[];
    };

    /** One named environment profile. */
    export type Profile = {
      /** Profile name used by `--profile`. */
      readonly name: string;
      /** Pi args applied before CLI passthrough args. */
      readonly args?: readonly string[];
      /** Extra read-scope paths for this profile. */
      readonly read?: readonly t.StringPath[];
      /** Environment variables for the Pi process. */
      readonly env?: Record<string, string>;
    };

    /** YAML validation result. */
    export type YamlCheck =
      | { readonly ok: true; readonly doc: ProfileSet }
      | { readonly ok: false; readonly errors: readonly unknown[] };
  }
}
