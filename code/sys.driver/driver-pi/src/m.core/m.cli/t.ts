import type { t } from './common.ts';

/**
 * Raw Pi process boundary shared by the profile launcher and explicit raw CLI.
 *
 * References:
 * - https://pi.dev/
 * - https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent
 *
 * This surface keeps upstream Pi execution behind explicit cwd, permissions,
 * package resolution, and runtime-state seams. Profile policy is modeled by
 * `PiCliProfiles` and exposed as the default public `/cli` entrypoint.
 *
 * Provenance:
 * - Upstream Pi coding-agent license: MIT
 */
export declare namespace PiCli {
  /** Runtime surface for the raw Pi process boundary. */
  export type Lib = {
    /** Parse wrapper args, optionally show help, then launch upstream Pi directly. */
    main(input?: Input): Promise<Result>;
    /** Run upstream Pi from a resolved cwd, sandbox, and argument set. */
    run(args: RunArgs): Promise<t.Process.InheritOutput>;
  };

  /** Startup cwd contract preserving invocation, runtime root, and optional git root. */
  export type Cwd = {
    /** Directory the operator invoked the launcher from. */
    readonly invoked: t.StringDir;

    /** Effective Pi runtime root used for state, sandbox, and profile-owned paths. */
    readonly root?: t.StringDir;

    /** Resolved git repository root when startup is git-rooted. */
    readonly git?: t.StringDir;
  };

  /** Startup cwd resolution result. */
  export type CwdResolution =
    | {
      /** Discriminator for a resolved startup cwd. */
      readonly kind: 'resolved';
      /** Resolved cwd contract used for launch. */
      readonly cwd: Cwd;
    }
    | {
      /** Discriminator for a user-cancelled cwd recovery flow. */
      readonly kind: 'exit';
    };

  /** Boundary entry input for launching Pi. */
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
    /** Resolved cwd contract already prepared by the launcher. */
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

  /** Runtime-root resolution strategy for startup cwd recovery. */
  export type GitRootMode = 'walk-up' | 'cwd' | 'none';

  /** Wrapper-local cwd resolution options. */
  export type CwdResolveOptions = {
    /** How startup resolves the effective runtime root from the invocation directory. */
    readonly gitRoot?: GitRootMode;
    /** Whether startup may prompt for git-init recovery when no git root exists. */
    readonly interactive?: boolean;
  };

  /** Typed boundary argv shape produced from `Args.parse(...)`. */
  export type ParsedArgs = {
    /** Whether wrapper help was requested. */
    readonly help?: boolean;
    /** Whether the wrapper should launch Pi with full Deno permissions. */
    readonly allowAll?: boolean;
    /** Runtime-root discovery mode parsed from `--git-root`. */
    readonly gitRoot?: GitRootMode;
    /** Pi args captured after wrapper-owned flags are removed. */
    readonly _: readonly string[];
  };

  /** Effective permission posture for the launched Pi child. */
  export type PermissionMode = 'scoped' | 'allow-all';

  /** Boundary result union. */
  export type Result = Help | Ran | Exit;

  /** Help output result. */
  export type Help = {
    /** Discriminator for help output. */
    readonly kind: 'help';
    /** Original launcher input. */
    readonly input: Input;
    /** Rendered help text written to stdout. */
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
    /** Discriminator for a user-cancelled launch. */
    readonly kind: 'exit';
    /** Original launcher input. */
    readonly input: Input;
  };

  /** Successful launch result. */
  export type Ran = {
    /** Discriminator for a launched Pi process. */
    readonly kind: 'run';
    /** Original launcher input. */
    readonly input: Input;
    /** Parsed wrapper args used for the launch. */
    readonly parsed: ParsedArgs;
    /** Inherited child-process output from the Pi invocation. */
    readonly output: t.Process.InheritOutput;
  };
}
