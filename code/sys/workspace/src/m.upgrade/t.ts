import type { t } from './common.ts';

/**
 * Dependency upgrades from a manifest: publication evidence, version choices, and file writes.
 */
export declare namespace WorkspaceUpgrade {
  /** Inspect or update dependency pins; only application writes files. */
  export type Lib = {
    /** Inspect published versions and age eligibility without changing dependency files. */
    collect(input: Input, options?: Options): Promise<CollectResult>;
    /** Choose upgrades and order known dependencies without changing dependency files. */
    upgrade(input: Input, options?: Options): Promise<Result>;
    /**
     * Compute a fresh plan and write the manifest and its generated dependency files.
     * Does not consume an earlier preview or ask for confirmation.
     *
     * Invalid or cyclic graphs reject before writing; incomplete registry evidence does not.
     * Files may be rewritten even when no version changes. Writes stop on failure without rollback.
     */
    apply(input: Input, options?: Options): Promise<ApplyResult>;
  };

  /** Rules for choosing newer versions from the age-eligible set. */
  export type Policy = {
    /** Allow patch, same-major, unrestricted, or no upgrades. */
    readonly mode: t.EsmPolicy.Mode;
    /** Exact package names or manifest aliases to leave unchanged. */
    readonly exclude?: readonly string[];
  };

  /** Manifest-entry counts by registry, not network-request counts. */
  export type RegistryProgressCounts = {
    readonly jsr: number;
    readonly npm: number;
  };

  /** Emitted before each version lookup; counts include the lookup about to begin. */
  export type RegistryProgress = {
    readonly kind: 'registry';
    readonly registry: t.EsmRegistry;
    /** Entries reached so far, including the current entry. */
    readonly current: RegistryProgressCounts;
    /** Entries with a usable current version in an enabled registry. */
    readonly total: RegistryProgressCounts;
    /** Entries reached across both registries, not completed responses. */
    readonly completed: number;
    /** Total entries scheduled for lookup; skipped entries are excluded. */
    readonly dependencies: number;
  };

  /** Entry into planning or application, not confirmation of success. */
  export type PhaseProgress = {
    readonly kind: 'plan' | 'apply';
  };

  /** Lookup starts and phase boundaries; no completion event is emitted. */
  export type Progress = RegistryProgress | PhaseProgress;

  /** Synchronous observer; a thrown error aborts the pass. */
  export type ProgressHandler = (progress: Progress) => void;

  /** Dependency manifest and output location. */
  export type Input = {
    /** Directory for deno.json and package.json; defaults to the manifest's directory. */
    readonly cwd?: t.StringDir;
    /** Manifest path; relative paths use the process working directory, not the output directory. */
    readonly deps: t.StringPath;
  };

  /** Version-selection controls and progress observation for one pass. */
  export type Options = {
    /** When options are omitted, allow same-major upgrades with no exclusions. */
    readonly policy: Policy;
    /** Include prereleases among visible versions; defaults to false. */
    readonly prerelease?: boolean;
    /** Registries to check; defaults to both JSR and npm. */
    readonly registries?: readonly t.EsmRegistry[];
    /**
     * Waiting period after publication for npm and JSR releases, in whole milliseconds.
     * Must be a nonnegative safe integer; zero disables the delay (default).
     * The current visible version is exempt. Missing, invalid, or future publication times
     * prevent other versions from passing an enabled age check.
     * A required deadline outside the supported date range rejects the pass.
     */
    readonly minimumDependencyAge?: t.Msecs;
    /**
     * Unix time in whole milliseconds, captured once per pass when omitted.
     * Must be nonnegative and within JavaScript's supported date range.
     */
    readonly evaluatedAt?: t.UnixTimestamp;
    /** Retained in the result; does not currently produce console output. */
    readonly log?: boolean;
    /** Observe lookup starts and phase changes. */
    readonly progress?: ProgressHandler;
  };

  /** Options with defaults filled and one evaluation time fixed for the pass. */
  export type ResolvedOptions = {
    readonly policy: Policy;
    readonly prerelease: boolean;
    readonly registries: readonly t.EsmRegistry[];
    readonly minimumDependencyAge: t.Msecs;
    readonly evaluatedAt: t.UnixTimestamp;
    readonly log: boolean;
    readonly progress?: ProgressHandler;
  };

  /** Entry counts, not unique packages or files written. */
  export type SummaryTotals = {
    /** All parsed manifest entries, including those not collected. */
    readonly dependencies: number;
    /** Collected entries with a permitted newer version. */
    readonly allowed: number;
    /** Collected entries without a permitted upgrade, including current or excluded entries. */
    readonly blocked: number;
    /** Allowed entries in a valid dependency order; zero if ordering fails. */
    readonly planned: number;
  };

  /** Failure to retrieve package metadata or derive dependency relationships. */
  export type GraphCode = 'registry:info' | 'registry:graph';

  /** Why a selected dependency's relationships remain unknown. */
  export type GraphReason = {
    readonly code: GraphCode;
    readonly message?: string;
  };

  /** Selected dependency with missing graph evidence; does not itself prevent application. */
  export type GraphUnresolved = {
    readonly entry: t.EsmDeps.Entry;
    readonly reason: GraphReason;
  };

  /**
   * Publication-age assessment, independent of version-selection policy.
   * Eligible releases are old enough, exempt as the current pin, or unchecked because the delay is off.
   * Standdown is a temporary hold; unknown covers missing, invalid, or future publication times.
   */
  export type VersionEligibility =
    | { readonly kind: 'eligible' }
    | {
      readonly kind: 'standdown';
      /** Unix-millisecond deadline; the release becomes eligible at this instant. */
      readonly eligibleAt: t.UnixTimestamp;
      /** Elapsed milliseconds since publication at evaluation time. */
      readonly age: t.Msecs;
    }
    | { readonly kind: 'unknown-published-at' };

  /** Publication evidence and age assessment for one visible release. */
  export type VersionFact = {
    readonly version: t.StringSemver;
    /** JSR creation time or npm publication time, preserved when valid; may still be in the future. */
    readonly publishedAt?: t.StringTimestamp;
    readonly eligibility: VersionEligibility;
  };

  /** Published-version evidence for one manifest entry, including releases too young to select. */
  export type Candidate = {
    /** The manifest entry; aliases of one package remain distinct. */
    readonly entry: t.EsmDeps.Entry;
    readonly registry: t.EsmRegistry;
    /** Normalized manifest version, not an installed or lockfile version. */
    readonly current: t.StringSemver;
    /** Highest visible version, not necessarily eligible or selected. */
    readonly latest?: t.StringSemver;
    /**
     * Visible versions in descending order, before the age check.
     * Excludes disabled prereleases; npm also excludes deprecated releases and versions
     * above a usable latest tag.
     */
    readonly available: readonly t.StringSemver[];
    /** Age-eligible subset in descending order; version policy is applied later. */
    readonly eligible: readonly t.StringSemver[];
    /** Publication facts in the same order as the visible versions. */
    readonly versions: readonly VersionFact[];
  };

  /** Why a manifest or dependency could not yield a candidate. */
  export type CollectCode =
    | 'deps:load'
    | 'registry:unsupported'
    | 'version:missing-current'
    | 'registry:fetch';

  /** Collection failure or deliberate omission, rather than a version-policy decision. */
  export type CollectReason = {
    readonly code: CollectCode;
    readonly message?: string;
  };

  /** Skipped or failed entry; a manifest-load failure uses a synthetic entry naming its path. */
  export type Uncollected = {
    readonly entry: t.EsmDeps.Entry;
    readonly reason: CollectReason;
  };

  /** Counts of inspected entries and collection outcomes. */
  export type CollectTotals = {
    /** Parsed entries after manifest normalization, not raw YAML rows. */
    readonly dependencies: number;
    /** Entries with registry version data, even if no visible versions remain. */
    readonly collected: number;
    /** Unusable current versions and disabled or unsupported registries. */
    readonly skipped: number;
    /** Registry lookup failures, or one manifest-load failure with zero dependencies. */
    readonly failed: number;
  };

  /** Registry evidence and collection failures; no dependency files have been written. */
  export type CollectResult = {
    /** Supplied paths, returned without normalization. */
    readonly input: Input;
    readonly options: ResolvedOptions;
    readonly totals: CollectTotals;
    readonly candidates: readonly Candidate[];
    /** Inspect even when other entries were collected successfully. */
    readonly uncollected: readonly Uncollected[];
    /** Resolver overrides carried from the manifest, not separate upgrade candidates. */
    readonly packageJson?: t.EsmDeps.PackageJsonPolicy;
  };

  /** Known relationships among approved upgrades, not a complete dependency graph. */
  export type Graph = {
    /** One node per allowed decision, keyed by registry and package name. */
    readonly nodes: t.EsmTopological.Decision.Input['nodes'];
    /** Directed from dependency to dependent; only planned nodes are included. */
    readonly edges: t.EsmTopological.Decision.Input['edges'];
    /** Missing evidence can coexist with successful topological ordering. */
    readonly unresolved: readonly GraphUnresolved[];
  };

  /** Non-writing plan; collection and graph diagnostics may describe incomplete evidence. */
  export type Result = {
    /** Supplied paths, returned without normalization. */
    readonly input: Input;
    readonly options: ResolvedOptions;
    readonly collect: CollectResult;
    /** Version decisions for collected entries only. */
    readonly policy: t.EsmPolicy.Result;
    readonly graph: Graph;
    /** Order over known edges, or a cycle/invalid-graph diagnostic. */
    readonly topological: t.EsmTopological.Decision.Result;
    readonly totals: SummaryTotals;
  };

  /** Returned only after the manifest and every requested dependency-file write completes. */
  export type ApplyResult = {
    /** Supplied paths, returned without normalization. */
    readonly input: Input;
    readonly options: ResolvedOptions;
    /** Fresh plan computed by this apply call, not a previously returned preview. */
    readonly upgrade: Result;
    /** Approved pins replaced; all other entries retain their versions. */
    readonly entries: readonly t.EsmDeps.Entry[];
    /** Written manifest, Deno imports, and optional package.json. */
    readonly files: t.EsmDeps.ApplyFilesResult;
  };
}
