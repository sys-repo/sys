import type { t } from './common.ts';

/** Probe helper that checks for the Git binary. */
export type GitProbeFn = (opts?: GitProbeOptions) => Promise<GitProbeResult>;

/** Configures what Git binary to look for. */
export type GitProbeOptions = {
  /** Optional override for the git binary (default: "git"). */
  readonly bin?: {
    readonly git?: string;
  };
};

/** Result returned by the Git probe routine. */
export type GitProbeResult =
  | { readonly ok: true; readonly bin: { readonly git: string } }
  | {
      readonly ok: false;
      readonly reason: GitProbeReason;
      readonly hint: string;
      readonly error?: unknown;
    };

/** Enumerates why the Git probe can fail. */
export type GitProbeReason = 'missing-git' | 'spawn-failed';
