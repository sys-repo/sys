import type { t } from './common.ts';

/**
 * Workspace dependency upgrade orchestration.
 */
export declare namespace WorkspaceUpgrade {
  /** Dependency upgrade orchestration surface. */
  export type Lib = {};

  /** Workspace-facing dependency policy selection. */
  export type Policy = {
    /** Version-selection mode applied during upgrade planning. */
    readonly mode: t.EsmPolicyMode;
    /** Dependency names or aliases excluded from upgrade selection. */
    readonly exclude?: readonly string[];
  };

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
    /** Registries consulted for available package versions. */
    readonly registries?: readonly t.EsmRegistry[];
    /** Emit orchestration logging to the console. */
    readonly log?: boolean;
  };

  /** Resolved options used for one workspace upgrade pass. */
  export type ResolvedOptions = {
    /** Policy applied to dependency version selection. */
    readonly policy: Policy;
    /** Registries consulted for available package versions. */
    readonly registries: readonly t.EsmRegistry[];
    /** Whether orchestration logging was enabled. */
    readonly log: boolean;
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

  /** Result from one workspace dependency upgrade pass. */
  export type Result = {
    /** Resolved orchestration input. */
    readonly input: Input;
    /** Resolved orchestration options. */
    readonly options: ResolvedOptions;
    /** Aggregate outcome counts. */
    readonly totals: SummaryTotals;
  };
}
