import type { t } from './common.ts';

/** Status command helper signature. */
export type GitStatusFn = (opts?: GitStatusOptions) => Promise<GitStatusResult>;

/** Options for running git status. */
export type GitStatusOptions = {
  /** Optional override for the git binary (default: "git"). */
  readonly bin?: { readonly git?: string };
  /** Include untracked files (default: false). */
  readonly untracked?: boolean;
};

/** Result returned by the git status command. */
export type GitStatusResult =
  | { readonly ok: true; readonly entries: readonly GitStatusEntry[] }
  | { readonly ok: false; readonly reason: GitStatusFailReason; readonly error?: unknown };

/** A single entry reported by git status --porcelain. */
export type GitStatusEntry = {
  readonly index: GitStatusCode;
  readonly worktree: GitStatusCode;
  readonly path: string;
  readonly pathTo?: string;
};

/** Status codes Git reports per-path in porcelain mode. */
export type GitStatusCode = ' ' | 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?';

/** Failure reasons for git status checking. */
export type GitStatusFailReason = 'missing-git' | 'not-a-repo' | 'spawn-failed' | 'parse-failed';
