import type { t } from './common.ts';

/**
 * Thin CLI transport surface for launching Pi.
 *
 * References:
 * - https://pi.dev/
 * - https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent
 *
 * This local surface is a thin `@sys` launcher wrapper over the upstream Pi
 * coding-agent project.
 *
 * Provenance:
 * - Upstream Pi coding-agent license: MIT
 */
export declare namespace PiCli {
  /** Runtime surface for the Pi CLI launcher wrapper. */
  export type Lib = {
    main(input?: Input): Promise<Result>;
    run(args: RunArgs): Promise<t.Process.InheritOutput>;
  };

  /** Startup cwd contract preserving invocation and resolved git roots. */
  export type Cwd = {
    /** Directory the operator invoked the launcher from. */
    readonly invoked: t.StringDir;

    /** Nearest ancestor git root used as the effective Pi launch root. */
    readonly git: t.StringDir;
  };

  /** Startup cwd resolution result. */
  export type CwdResolution =
    | { readonly kind: 'resolved'; readonly cwd: Cwd }
    | { readonly kind: 'exit' };

  /** Wrapper entry input for launching Pi. */
  export type Input = {
    /** Raw argv tokens passed to the CLI wrapper entrypoint. */
    readonly argv?: readonly string[];

    /**
     * Working directory passed to the Pi child process.
     * Defaults to the current host working directory.
     */
    readonly cwd?: t.StringDir | Cwd;

    /** Optional environment variable overrides for the Pi child process. */
    readonly env?: Record<string, string>;

    /** Unsafe debug escape hatch: launch the Pi child with Deno full permissions. */
    readonly allowAll?: boolean;

    /** Additional read-scope paths supplied by the caller. */
    readonly read?: readonly t.StringPath[];

    /** Additional write-scope paths supplied by the caller. */
    readonly write?: readonly t.StringPath[];

    /** Pi package spec to execute. Defaults to the canonical upstream package stem. */
    readonly pkg?: t.StringModuleSpecifier;
  };

  /** Concrete Pi run request after startup cwd resolution. */
  export type RunArgs = {
    /** Git-rooted cwd contract already resolved by the launcher. */
    readonly cwd: Cwd;

    /** Additional Pi CLI arguments. */
    readonly args?: readonly string[];

    /** Optional environment variable overrides for the Pi child process. */
    readonly env?: Record<string, string>;

    /** Unsafe debug escape hatch: launch the Pi child with Deno full permissions. */
    readonly allowAll?: boolean;

    /** Additional read-scope paths supplied by the caller. */
    readonly read?: readonly t.StringPath[];

    /** Additional write-scope paths supplied by the caller. */
    readonly write?: readonly t.StringPath[];

    /** Pi package spec to execute. Defaults to the canonical upstream package stem. */
    readonly pkg?: t.StringModuleSpecifier;
  };

  /** Git root resolution strategy for startup cwd recovery. */
  export type GitRootMode = 'walk-up' | 'cwd';

  /** Wrapper-local cwd resolution options. */
  export type CwdResolveOptions = {
    /** How startup resolves the effective git root from the invocation directory. */
    readonly gitRoot?: GitRootMode;
  };

  /** Typed wrapper argv shape produced from `Args.parse(...)`. */
  export type ParsedArgs = {
    readonly help?: boolean;
    readonly allowAll?: boolean;
    readonly gitRoot?: GitRootMode;
    readonly _: readonly string[];
  };

  /** Effective permission posture for the launched Pi child. */
  export type PermissionMode = 'scoped' | 'allow-all';

  /** Wrapper result union. */
  export type Result = Help | Ran | Exit;

  /** Help output result. */
  export type Help = {
    readonly kind: 'help';
    readonly input: Input;
    readonly text: string;
  };

  /** Resolved sandbox contract shown before launch. */
  export type SandboxSummary = {
    /** Optional persisted report path for the full sandbox inspection artifact. */
    readonly report?: t.StringPath;
    /** Effective permission posture for the launched Pi child. */
    readonly permissions: PermissionMode;
    /** Working directories preserved across startup resolution. */
    readonly cwd: Cwd;
    /** Effective read scope grouped for display. */
    readonly read?: SandboxSummary.Scope;
    /** Effective write scope grouped for display. */
    readonly write?: SandboxSummary.Scope;
    /** Intentional guidance context injected by the launcher. */
    readonly context?: {
      /** Source guidance files read by the wrapper and injected into Pi's prompt. */
      readonly include?: readonly t.StringPath[];
    };
  };

  /** Display-oriented sandbox summary helpers. */
  export namespace SandboxSummary {
    /** Grouped scope details for one capability lane. */
    export type Scope = {
      /** Human-readable summary groups. */
      readonly summary?: readonly string[];
      /** Optional detail entries shown below the main summary table. */
      readonly detail?: readonly t.StringPath[];
    };
  }

  /** User exited startup without launching Pi. */
  export type Exit = {
    readonly kind: 'exit';
    readonly input: Input;
  };

  /** Successful launch result. */
  export type Ran = {
    readonly kind: 'run';
    readonly input: Input;
    readonly parsed: ParsedArgs;
    readonly output: t.Process.InheritOutput;
  };
}
