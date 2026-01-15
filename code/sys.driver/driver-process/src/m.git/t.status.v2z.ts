import type { t } from './common.ts';

/** Status command helper signature for porcelain v2 -z output. */
export type GitStatusPorcelainV2ZFn = (
  opts?: GitStatusPorcelainV2ZOptions,
) => Promise<GitStatusPorcelainV2ZResult>;

/** Options for running ``git status --porcelain=v2 -z``. */
export type GitStatusPorcelainV2ZOptions = {
  /** Working directory to execute git commands in. */
  readonly cwd?: t.StringDir;
  /** Optional override for the git binary (default: "git"). */
  readonly bin?: { readonly git?: string };
  /** Include untracked files (default: true). */
  readonly untracked?: boolean;
  /** Enable rename detection (default: true). */
  readonly findRenames?: boolean;
};

/** Result returned by the raw porcelain v2 -z status command. */
export type GitStatusPorcelainV2ZResult =
  | { readonly ok: true; readonly stdout: string }
  | { readonly ok: false; readonly reason: t.GitFailReason; readonly error?: unknown };
