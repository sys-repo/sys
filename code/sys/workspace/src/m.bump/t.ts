import type { t } from './common.ts';

/**
 * Workspace package version bump orchestration.
 */
export declare namespace WorkspaceBump {
  /** Workspace package version bump helper surface. */
  export type Lib = {
    /** Argument parsers for workspace bump flows. */
    readonly Args: Args.Lib;
    /** Console output formatters for workspace bump flows. */
    readonly Fmt: Fmt.Lib;
    /** Collect bumpable workspace packages from the local workspace. */
    collect(args?: CollectArgs): Promise<CollectResult>;
    /** Plan one workspace package bump from selected roots. */
    plan(args: PlanArgs): Promise<PlanResult>;
    /** Apply one planned workspace package bump. */
    apply(args: ApplyArgs): Promise<ApplyResult>;
    /** Run one canonical workspace package bump pass. */
    run(args?: RunArgs): Promise<RunResult>;
  };

  /** One package-level dependency edge in the local workspace graph. */
  export type PackageEdge = {
    /** Package path that depends on `to`. */
    readonly from: t.StringPath;
    /** Package path required by `from`. */
    readonly to: t.StringPath;
  };

  /** One workspace package eligible for manifest version bumping. */
  export type Candidate = {
    /** Canonical workspace package root path. */
    readonly pkgPath: t.StringPath;
    /** Canonical `deno.json` path for the package. */
    readonly denoFilePath: t.StringPath;
    /** Canonical package name from `deno.json`. */
    readonly name: string;
    /** Current and planned next version pair. */
    readonly version: {
      /** Current package version. */
      readonly current: t.Semver;
      /** Next package version for the requested release type. */
      readonly next: t.Semver;
    };
  };

  /** One resolved bump plan rooted at one or more selected packages. */
  export type PlanResult = {
    /** Canonical bump root packages in stable workspace order. */
    readonly roots: readonly Candidate[];
    /** Ordered selected packages affected by the bump. */
    readonly selected: readonly Candidate[];
    /** Ordered selected package paths for quick membership checks. */
    readonly selectedPaths: readonly t.StringPath[];
  };

  /** One persisted version write from an applied bump plan. */
  export type WriteResult = {
    /** Workspace package root path written by the bump. */
    readonly pkgPath: t.StringPath;
    /** Package `deno.json` path written to disk. */
    readonly denoFilePath: t.StringPath;
    /** Previous version before the bump. */
    readonly previous: t.Semver;
    /** New version written by the bump. */
    readonly next: t.Semver;
  };

  /** One optional post-apply command executed after writes complete. */
  export type Followup = {
    /** Human-readable label for the follow-up step. */
    readonly label: string;
    /** Command executable. */
    readonly cmd: string;
    /** Command arguments. */
    readonly args?: readonly string[];
    /** Optional working directory for the command. */
    readonly cwd?: t.StringDir;
  };

  /** Result from applying one planned bump. */
  export type ApplyResult = {
    /** Planned bump that was applied. */
    readonly plan: PlanResult;
    /** Version writes performed by the bump. */
    readonly writes: readonly WriteResult[];
    /** Follow-up commands requested after the bump. */
    readonly followups: readonly Followup[];
  };

  /** Result from collecting workspace bump candidates. */
  export type CollectResult = {
    /** Working directory used for collection. */
    readonly cwd: t.StringDir;
    /** Release type used to derive next versions. */
    readonly release: t.SemverReleaseType;
    /** Ordered workspace graph package paths used during collection. */
    readonly orderedPaths: readonly t.StringPath[];
    /** Derived package dependency edges used for bump planning. */
    readonly edges: readonly PackageEdge[];
    /** Collected bump candidates. */
    readonly candidates: readonly Candidate[];
  };

  /** Result from running one canonical bump pass. */
  export type RunResult = {
    /** Collected workspace package data used for the run. */
    readonly collect: CollectResult;
    /** Planned selection and affected packages. */
    readonly plan: PlanResult;
    /** Applied writes and follow-up commands, when the run was not a dry run. */
    readonly apply?: ApplyResult;
    /** Whether the run completed in dry-run mode. */
    readonly dryRun: boolean;
  };

  /** Canonical progress step emitted during one bump run. */
  export type PhaseProgress = {
    /** Canonical bump progress phase. */
    readonly kind: 'collect' | 'plan' | 'integrity' | 'apply' | 'followup';
  };

  /** Callback for bump run progress events. */
  export type ProgressHandler = (progress: PhaseProgress) => void;

  /** Predicate used to exclude packages from bump consideration. */
  export type Exclude = (path: t.StringPath) => boolean;

  /** Optional follow-up command provider for applied bumps. */
  export type Followups = (args: {
    readonly cwd: t.StringDir;
    readonly plan: PlanResult;
  }) => readonly Followup[];

  /** Common bump policy injected from the repo edge. */
  export type Policy = {
    /** Optional package exclusion predicate. */
    readonly exclude?: Exclude;
    /** Optional extra package dependency edges layered onto the workspace graph. */
    readonly couplings?: readonly PackageEdge[];
    /** Optional post-apply follow-up commands. */
    readonly followups?: Followups;
  };

  /** Arguments for collecting bumpable workspace packages. */
  export type CollectArgs = {
    /** Working directory used to resolve the local workspace. */
    readonly cwd?: t.StringDir;
    /** Optional precomputed ordered package paths. */
    readonly orderedPaths?: readonly t.StringPath[];
    /** Optional precomputed package dependency edges. */
    readonly edges?: readonly PackageEdge[];
    /** Release type used to derive next versions. Defaults to `patch`. */
    readonly release?: t.SemverReleaseType;
    /** Repo-specific bump policy. */
    readonly policy?: Policy;
  };

  /** Arguments for planning one workspace package bump. */
  export type PlanArgs = {
    /** Collected workspace bump inputs. */
    readonly collect: CollectResult;
    /** Resolved workspace package root paths used as bump roots. */
    readonly rootPkgPaths: readonly t.StringPath[];
  };

  /** Arguments for applying one planned workspace package bump. */
  export type ApplyArgs = {
    /** Working directory used for writes and follow-up commands. */
    readonly cwd?: t.StringDir;
    /** Planned bump to apply. */
    readonly plan: PlanResult;
    /** Optional repo-specific follow-up command policy. */
    readonly policy?: Policy;
  };

  /** Arguments for running one canonical workspace package bump pass. */
  export type RunArgs = {
    /** Working directory used to resolve the local workspace. */
    readonly cwd?: t.StringDir;
    /** Release type used to derive next versions. Defaults to `patch`. */
    readonly release?: t.SemverReleaseType;
    /** Optional preselected bump roots by package name or package path. */
    readonly from?: readonly string[];
    /** Render the plan without writing any files. */
    readonly dryRun?: boolean;
    /** Emit orchestration logging to the console. */
    readonly log?: boolean;
    /** Skip interactive prompts once bump roots are known. */
    readonly nonInteractive?: boolean;
    /** Optional progress callback for long-running bump phases. */
    readonly progress?: ProgressHandler;
    /** Repo-specific bump policy. */
    readonly policy?: Policy;
  };

  /** Argument parsers for workspace bump flows. */
  export namespace Args {
    /** Argument helper surface for workspace bump flows. */
    export type Lib = {
      /** Parse one bump argv vector into canonical CLI args. */
      parse(argv?: string[]): Parsed;
      /** Normalize one semver release type argument. */
      release(input?: string): t.SemverReleaseType | undefined;
      /** Resolve one canonical bump run invocation from argv, overrides, and policy. */
      run(input?: RunInput): RunResolved;
    };

    /** Parsed CLI args for workspace bump flows. */
    export type Parsed = {
      readonly help?: boolean;
      readonly from?: readonly string[];
      readonly release?: string;
      readonly dryRun: boolean;
      readonly nonInteractive: boolean;
    };

    /** Optional run-argument overrides from a script edge. */
    export type RunOptions = Partial<
      Pick<RunArgs, 'cwd' | 'release' | 'from' | 'dryRun' | 'nonInteractive'>
    >;

    /** Inputs for resolving one canonical bump run invocation. */
    export type RunInput = {
      /** Optional argv vector to parse. */
      readonly argv?: string[];
      /** Optional run-argument overrides from the caller. */
      readonly options?: RunOptions;
      /** Optional repo policy to attach to the resolved run args. */
      readonly policy?: Policy;
    };

    /** Resolved script-edge bump run inputs. */
    export type RunResolved = {
      /** Whether help was requested by argv. */
      readonly help: boolean;
      /** Invalid raw release string from argv, when one was supplied. */
      readonly invalidRelease?: string;
      /** Canonical args for `Workspace.Bump.run(...)`. */
      readonly run: RunArgs;
    };
  }

  /** Console output formatters for workspace bump flows. */
  export namespace Fmt {
    /** Console output formatting surface for workspace bumps. */
    export type Lib = {
      /** Render canonical help for the bump task surface. */
      help(): void;
      /** Format one unsupported release warning for script edges. */
      invalidRelease(input: string): string;
      /** Format one canonical spinner label for bump orchestration. */
      phase(args: PhaseLabelArgs): string;
      /** Derive aligned label widths for candidate selection. */
      selectionLayout(candidates: readonly Candidate[]): SelectionLayout;
      /** Format one interactive candidate selection label. */
      selectionLabel(args: SelectionLabelArgs): string;
      /** Format one preflight table row. */
      preflightRow(args: PreflightRowArgs): string[];
      /** Format the planned bump summary lines. */
      planSummary(args: PlanSummaryArgs): readonly string[];
      /** Format the canonical dry-run notice. */
      dryRun(): string;
    };

    /** Selection-label layout widths derived from bump candidates. */
    export type SelectionLayout = {
      /** Visible width reserved for package names. */
      readonly name: number;
      /** Visible width reserved for current versions. */
      readonly version: number;
    };

    /** Arguments for formatting one interactive selection option. */
    export type SelectionLabelArgs = {
      /** Candidate being rendered. */
      readonly candidate: Candidate;
      /** Shared layout widths for aligned labels. */
      readonly layout: SelectionLayout;
      /** Release type highlighted in the label. */
      readonly release: t.SemverReleaseType;
    };

    /** Arguments for formatting one preflight table row. */
    export type PreflightRowArgs = {
      /** Candidate being rendered in the table. */
      readonly candidate: Candidate;
      /** Selected package paths affected by the bump. */
      readonly selectedPaths: ReadonlySet<string>;
      /** Release type highlighted in the next-version column. */
      readonly release: t.SemverReleaseType;
    };

    /** Arguments for formatting the planned bump summary. */
    export type PlanSummaryArgs = {
      /** Planned bump to summarize. */
      readonly plan: PlanResult;
    };

    /** Arguments for formatting one bump phase label. */
    export type PhaseLabelArgs = {
      /** Canonical phase kind being rendered. */
      readonly kind: PhaseProgress['kind'];
      /** Optional follow-up label for `followup` phases. */
      readonly followup?: string;
    };
  }
}
