import type { t } from '../common.ts';

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

export type NoopPushTarget = {
  readonly provider: t.DeployTool.Config.Provider.Noop;
  readonly sourceDir: t.StringDir;
  readonly stagingDir?: t.StringDir;
  readonly shard?: number;
  readonly domain?: string;
};

export type PushTarget = OrbiterPushTarget | NoopPushTarget;

export type PushTargetStats = {
  readonly total: number;
  readonly shard: number;
  readonly root: number;
  readonly base: number;
  readonly skippedShards: number;
};

export type PushTargetPlan = {
  readonly targets: readonly PushTarget[];
  readonly stats: PushTargetStats;
};

export type OrbiterPushTargetPlan = {
  readonly targets: readonly OrbiterPushTarget[];
  readonly stats: PushTargetStats;
};

/**
 * Push execution result.
 */
export type PushResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: 'probe-failed' | 'unsupported-provider' | 'not-implemented' | 'failed';
      readonly hint?: string;
      readonly error?: unknown;
    };
