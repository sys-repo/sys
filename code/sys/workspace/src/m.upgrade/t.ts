import type { t } from './common.ts';

/**
 * Workspace dependency upgrade orchestration.
 */
export declare namespace WorkspaceUpgrade {
  /** Dependency upgrade orchestration surface. */
  export type Lib = {
    /** Collect canonical dependency upgrade candidates from manifest and registry inputs. */
    collect(input: Input, options?: Options): Promise<CollectResult>;
    /** Compose policy and topological ordering into one canonical upgrade result. */
    upgrade(input: Input, options?: Options): Promise<Result>;
    /** Plan and apply one canonical workspace dependency upgrade pass. */
    apply(input: Input, options?: Options): Promise<ApplyResult>;
  };

  /** Workspace-facing dependency policy selection. */
  export type Policy = {
    /** Version-selection mode applied during upgrade planning. */
    readonly mode: t.EsmPolicyMode;
    /** Dependency names or aliases excluded from upgrade selection. */
    readonly exclude?: readonly string[];
  };

  /** Per-registry collection counts emitted while checking available versions. */
  export type RegistryProgressCounts = {
    /** Number of JSR dependencies reached in the registry check phase. */
    readonly jsr: number;
    /** Number of npm dependencies reached in the registry check phase. */
    readonly npm: number;
  };

  /** Registry collection progress emitted while checking available package versions. */
  export type RegistryProgress = {
    /** Canonical progress step. */
    readonly kind: 'registry';
    /** Registry currently being checked. */
    readonly registry: t.EsmRegistry;
    /** Inclusive per-registry counts reached so far. */
    readonly current: RegistryProgressCounts;
    /** Total per-registry dependencies to check in this pass. */
    readonly total: RegistryProgressCounts;
    /** Inclusive total registry checks reached so far. */
    readonly completed: number;
    /** Total registry checks in this pass. */
    readonly dependencies: number;
  };

  /** Non-registry orchestration phase progress. */
  export type PhaseProgress = {
    /** Canonical progress step. */
    readonly kind: 'plan' | 'apply';
  };

  /** Progress event emitted during one workspace upgrade pass. */
  export type Progress = RegistryProgress | PhaseProgress;

  /** Callback for upgrade progress events. */
  export type ProgressHandler = (progress: Progress) => void;

  /** Canonical dependency source selection for workspace upgrades. */
  export type Input = {
    /** Working directory used to resolve upgrade inputs. */
    readonly cwd?: t.StringDir;
    /** Canonical dependency manifest path. */
    readonly deps: t.StringPath;
  };

  /** Options controlling workspace dependency upgrades. */
  export type Options = {
    /** Policy applied to dependency version selection. */
    readonly policy: Policy;
    /** Whether prerelease versions are considered during collection and planning. */
    readonly prerelease?: boolean;
    /** Registries consulted for available package versions. */
    readonly registries?: readonly t.EsmRegistry[];
    /** Emit orchestration logging to the console. */
    readonly log?: boolean;
    /** Optional progress callback for long-running upgrade phases. */
    readonly progress?: ProgressHandler;
  };

  /** Resolved options used for one workspace upgrade pass. */
  export type ResolvedOptions = {
    /** Policy applied to dependency version selection. */
    readonly policy: Policy;
    /** Whether prerelease versions are considered during collection and planning. */
    readonly prerelease: boolean;
    /** Registries consulted for available package versions. */
    readonly registries: readonly t.EsmRegistry[];
    /** Whether orchestration logging was enabled. */
    readonly log: boolean;
    /** Optional progress callback for long-running upgrade phases. */
    readonly progress?: ProgressHandler;
  };

  /** Aggregate counts from one workspace upgrade pass. */
  export type SummaryTotals = {
    /** Number of dependency entries evaluated. */
    readonly dependencies: number;
    /** Number of dependencies allowed by policy. */
    readonly allowed: number;
    /** Number of dependencies blocked by policy. */
    readonly blocked: number;
    /** Number of dependencies included in the ordered plan. */
    readonly planned: number;
  };

  /** Canonical dependency-graph derivation code. */
  export type GraphCode = 'registry:info' | 'registry:graph';

  /** Structured reason explaining why graph derivation could not complete for one dependency. */
  export type GraphReason = {
    /** Canonical graph-derivation code. */
    readonly code: GraphCode;
    /** Optional human-readable detail. */
    readonly message?: string;
  };

  /** One dependency whose graph relationships could not be fully derived. */
  export type GraphUnresolved = {
    /** Canonical manifest entry whose graph information is incomplete. */
    readonly entry: t.EsmDeps.Entry;
    /** Structured graph-derivation reason. */
    readonly reason: GraphReason;
  };

  /** One collected dependency candidate. */
  export type Candidate = {
    /** Canonical manifest entry being evaluated. */
    readonly entry: t.EsmDeps.Entry;
    /** Registry used to resolve available versions. */
    readonly registry: t.EsmRegistry;
    /** Normalized current pinned version. */
    readonly current: t.StringSemver;
    /** Latest version reported by the registry when available. */
    readonly latest?: t.StringSemver;
    /** Available versions reported by the registry, sorted descending. */
    readonly available: readonly t.StringSemver[];
  };

  /** Canonical non-collection code. */
  export type CollectCode =
    | 'deps:load'
    | 'registry:unsupported'
    | 'version:missing-current'
    | 'registry:fetch';

  /** Structured non-collection reason. */
  export type CollectReason = {
    /** Canonical non-collection code. */
    readonly code: CollectCode;
    /** Optional human-readable detail. */
    readonly message?: string;
  };

  /** One dependency that was not collected into a registry-backed candidate. */
  export type Uncollected = {
    /** Canonical manifest entry that could not be collected. */
    readonly entry: t.EsmDeps.Entry;
    /** Structured non-collection reason. */
    readonly reason: CollectReason;
  };

  /** Aggregate counts from one candidate-collection pass. */
  export type CollectTotals = {
    /** Number of dependency entries inspected from the manifest. */
    readonly dependencies: number;
    /** Number of dependencies collected successfully. */
    readonly collected: number;
    /** Number of dependencies skipped before registry fetch. */
    readonly skipped: number;
    /** Number of dependencies that failed during registry fetch. */
    readonly failed: number;
  };

  /** Result from collecting canonical dependency upgrade candidates. */
  export type CollectResult = {
    /** Resolved orchestration input. */
    readonly input: Input;
    /** Resolved orchestration options. */
    readonly options: ResolvedOptions;
    /** Aggregate collection counts. */
    readonly totals: CollectTotals;
    /** Successfully collected dependency candidates. */
    readonly candidates: readonly Candidate[];
    /** Dependencies not collected into upgrade candidates. */
    readonly uncollected: readonly Uncollected[];
  };

  /** Derived dependency graph used for ordered upgrade planning. */
  export type Graph = {
    /** Nodes entering ordered planning. */
    readonly nodes: t.EsmTopologicalInput['nodes'];
    /** Derived dependency edges between the planned nodes. */
    readonly edges: t.EsmTopologicalInput['edges'];
    /** Dependencies whose graph relationships were not fully derivable. */
    readonly unresolved: readonly GraphUnresolved[];
  };

  /** Result from one workspace dependency upgrade pass. */
  export type Result = {
    /** Resolved orchestration input. */
    readonly input: Input;
    /** Resolved orchestration options. */
    readonly options: ResolvedOptions;
    /** Canonical candidate collection result. */
    readonly collect: CollectResult;
    /** Policy decisions across collected candidates. */
    readonly policy: t.EsmPolicyResult;
    /** Derived dependency graph used for topological ordering. */
    readonly graph: Graph;
    /** Topological ordering result across the derived dependency graph. */
    readonly topological: t.EsmTopologicalResult;
    /** Aggregate outcome counts. */
    readonly totals: SummaryTotals;
  };

  /** Result from planning and applying one workspace dependency upgrade pass. */
  export type ApplyResult = {
    /** Resolved orchestration input. */
    readonly input: Input;
    /** Resolved orchestration options. */
    readonly options: ResolvedOptions;
    /** Canonical upgrade planning result used for application. */
    readonly upgrade: Result;
    /** Canonical manifest entries after selected versions were applied. */
    readonly entries: readonly t.EsmDeps.Entry[];
    /** Driver-deno file apply result. */
    readonly files: t.DenoDeps.ApplyFilesResult;
  };
}
