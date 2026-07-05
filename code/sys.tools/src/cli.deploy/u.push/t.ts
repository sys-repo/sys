import type { t } from '../common.ts';

/** Provider preflight result before a deploy push is attempted. */
export type PushProbe =
  | { readonly ok: true }
  | {
    readonly ok: false;
    /** Coarse reason (stable for callers). */
    readonly reason: 'no-provider' | 'not-found' | 'failed' | 'unsupported-provider';

    /**
     * One-line human hint (optional).
     * For "not-found", this should be the install command (eg "npm i -g orbiter-cli").
     */
    readonly hint?: string;

    /** Raw error for diagnostics (do not stringify unless needed). */
    readonly error?: unknown;
  };

/** Common identity and filesystem context for a resolved push target. */
export type PushTargetContext = {
  readonly index?: number;
  readonly provider: string;
  readonly sourceDir?: t.StringDir;
  readonly stagingDir?: t.StringDir;
  readonly shard?: number;
  readonly domain?: string;
  readonly siteId?: string;
  readonly bucket?: string;
  readonly prefix?: string;
};

/** Push target that could not be resolved to publishable staging output. */
export type PushMissingTarget = PushTargetContext & {
  readonly reason: 'missing-staging-output' | 'missing-dist-metadata';
};

/**
 * Provider-specific push target.
 *
 * This is the local execution context a provider pushes from.
 * Some providers publish a prepared staging dir, while others may stage
 * internally from a source package dir.
 */
export type OrbiterPushTarget = {
  readonly provider: t.DeployTool.Config.Provider.Orbiter;
  readonly sourceDir: t.StringDir;
  readonly stagingDir: t.StringDir;
  readonly shard?: number;
  readonly domain?: string;
};

/** No-op provider target used to validate deploy flows without publishing. */
export type NoopPushTarget = {
  readonly provider: t.DeployTool.Config.Provider.Noop;
  readonly sourceDir: t.StringDir;
  readonly stagingDir?: t.StringDir;
  readonly shard?: number;
  readonly domain?: string;
};

/** Cloudflare R2 push target resolved from endpoint staging configuration. */
export type R2PushTarget = {
  readonly provider: t.DeployTool.Config.Provider.R2;
  readonly sourceDir: t.StringDir;
  readonly stagingDir: t.StringDir;
  readonly shard?: number;
  readonly domain?: string;
};

/** Any provider-specific publish target the deploy push command can execute. */
export type PushTarget = OrbiterPushTarget | NoopPushTarget | R2PushTarget;

/** Aggregate target-resolution counts for a provider push plan. */
export type PushPlanStats = {
  readonly total: number;
  readonly missing: number;
};

/** Orbiter target-resolution counts split by base, root, and shard output. */
export type OrbiterPushTargetStats = {
  readonly total: number;
  readonly shard: number;
  readonly root: number;
  readonly base: number;
  readonly skippedShards: number;
  readonly missing: number;
};

/** Provider-neutral plan of publishable and missing push targets. */
export type PushTargetPlan = {
  readonly targets: readonly PushTarget[];
  readonly missing: readonly PushMissingTarget[];
  readonly stats: PushPlanStats;
};

/** Orbiter-specific plan preserving shard-aware target statistics. */
export type OrbiterPushTargetPlan = {
  readonly targets: readonly OrbiterPushTarget[];
  readonly missing: readonly PushMissingTarget[];
  readonly stats: OrbiterPushTargetStats;
};

/** Stable status for one provider publish file result. */
export type PushPublishFileStatus = 'written' | 'skipped';

/** Provider-reported publish outcome for one staged file path. */
export type PushPublishFile = {
  readonly path: t.Files.String.Path;
  readonly status: PushPublishFileStatus;
  /** Content digest/hash reference when known from staging metadata. */
  readonly digest?: t.StringHash | t.StringUri;
  /** Bytes written during this push. Omitted for unchanged/skipped files. */
  readonly bytes?: number;
  readonly mediaType?: t.StringMimeType;
};

/** Rich provider publish details. Summary counts are derived, not stored. */
export type PushPublishStats = {
  readonly files: readonly PushPublishFile[];
};

/** Derived publish counts for CLI reporting. */
export type PushPublishSummary = {
  readonly total: number;
  readonly written: number;
  readonly skipped: number;
};

/** Stable status for one provider prune file result. */
export type PushPruneFileStatus = 'removed';

/** Provider-reported stale-file removal outcome for one remote file path. */
export type PushPruneFile = {
  readonly path: t.Files.String.Path;
  readonly status: PushPruneFileStatus;
};

/** Rich provider prune details. Summary counts are derived, not stored. */
export type PushPruneStats = {
  readonly files: readonly PushPruneFile[];
};

/** Derived stale-file removal counts for CLI reporting. */
export type PushPruneSummary = {
  readonly total: number;
  readonly removed: number;
};

/**
 * Push execution result.
 */
export type PushResult =
  | { readonly ok: true; readonly publish?: PushPublishStats; readonly prune?: PushPruneStats }
  | {
    readonly ok: false;
    readonly reason: 'probe-failed' | 'unsupported-provider' | 'not-implemented' | 'failed';
    readonly hint?: string;
    readonly error?: unknown;
  };
