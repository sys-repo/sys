import type { t } from './common.ts';

/**
 * CLI entrypoints for workspace tooling.
 */
export declare namespace WorkspaceCli {
  /** Runtime surface for workspace CLI flows. */
  export type Lib = {
    /** Run the workspace CLI from raw argv input. */
    run(input?: Input): Promise<Result>;
  };

  /** Raw CLI entrypoint input. */
  export type Input = {
    /** Raw argv tokens passed to the CLI entrypoint. */
    readonly argv?: readonly string[];
    /** Optional working directory override. */
    readonly cwd?: t.StringDir;
  };

  /** Interaction mode for one CLI run. */
  export type Mode = 'interactive' | 'non-interactive';

  /** Typed argv shape produced by `Args.parse(...)` for the workspace CLI. */
  export type ParsedArgs = {
    /** Apply file changes instead of only planning/reporting. */
    readonly apply?: boolean;
    /** Explicit interaction override. */
    readonly 'non-interactive'?: boolean;
    /** Upgrade policy mode override. */
    readonly mode?: t.EsmPolicyMode;
    /** Canonical dependency manifest path override. */
    readonly deps?: string;
    /** Dependency names or aliases to include. */
    readonly include?: string | readonly string[];
    /** Dependency names or aliases to exclude. */
    readonly exclude?: string | readonly string[];
  };

  /** Fully normalized CLI options for one run. */
  export type ResolvedOptions = {
    /** Canonical dependency manifest path for the run. */
    readonly deps: t.StringPath;
    /** Whether prompts and selection menus are allowed. */
    readonly mode: Mode;
    /** Upgrade policy mode passed through to workspace orchestration. */
    readonly policy: t.EsmPolicyMode;
    /** Dependency names or aliases to include. */
    readonly include: readonly string[];
    /** Dependency names or aliases to exclude. */
    readonly exclude: readonly string[];
    /** Apply file changes instead of only planning/reporting. */
    readonly apply: boolean;
  };

  /** Selection resolved by the CLI before planning or apply. */
  export type Selection = {
    /** Dependency names or aliases selected for inclusion. */
    readonly include: readonly string[];
    /** Dependency names or aliases excluded from the run. */
    readonly exclude: readonly string[];
  };

  /** Result from a workspace CLI run. */
  export type Result = Planned | Applied;

  /** Planned-only CLI run result. */
  export type Planned = {
    /** Result discriminant. */
    readonly kind: 'plan';
    /** Raw input passed to the CLI entrypoint. */
    readonly input: Input;
    /** Fully normalized options used for the run. */
    readonly options: ResolvedOptions;
    /** Final include/exclude selection resolved by the CLI. */
    readonly selection: Selection;
    /** Planning result for the current run. */
    readonly upgrade: t.WorkspaceUpgrade.Result;
  };

  /** Planned-and-applied CLI run result. */
  export type Applied = {
    /** Result discriminant. */
    readonly kind: 'apply';
    /** Raw input passed to the CLI entrypoint. */
    readonly input: Input;
    /** Fully normalized options used for the run. */
    readonly options: ResolvedOptions;
    /** Final include/exclude selection resolved by the CLI. */
    readonly selection: Selection;
    /** Planning result for the current run. */
    readonly upgrade: t.WorkspaceUpgrade.Result;
    /** Apply result when file mutation was requested. */
    readonly applied: t.WorkspaceUpgrade.ApplyResult;
  };
}
