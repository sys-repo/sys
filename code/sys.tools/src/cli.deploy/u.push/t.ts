import type { t } from '../common.ts';

/** Common identity and filesystem context for a resolved push target. */
export type PushTargetContext = {
  readonly index?: number;
  readonly provider: string;
  readonly sourceDir?: t.StringDir;
  readonly stagingDir?: t.StringDir;
  readonly domain?: string;
  readonly bucket?: string;
  readonly prefix?: string;
};

/** Push target that could not be resolved to publishable staging output. */
export type PushMissingTarget = PushTargetContext & {
  readonly reason: 'missing-staging-output' | 'missing-dist-metadata';
};

/** Cloudflare R2 push target resolved from endpoint staging configuration. */
export type R2PushTarget = {
  readonly provider: t.DeployTool.Config.Provider.R2;
  readonly sourceDir: t.StringDir;
  readonly stagingDir: t.StringDir;
  readonly domain?: string;
};

/** Resolved publish target accepted by deploy push execution. */
export type PushTarget = R2PushTarget;

/** Provider-neutral plan of publishable and missing push targets. */
export type PushTargetPlan = {
  readonly targets: readonly PushTarget[];
  readonly missing: readonly PushMissingTarget[];
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
    readonly reason: 'failed';
    readonly hint?: string;
    readonly error?: unknown;
  };
