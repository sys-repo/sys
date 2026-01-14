import type { t } from './common.ts';

/**
 * Determine the Git repository root for a given working directory.
 *
 * Uses `git rev-parse --show-toplevel` and returns a typed result
 * instead of throwing, enabling reliable composition in tooling.
 */
export type GitRootFn = (opts?: GitRootOptions) => Promise<GitRootResult>;

/** Options for running git root lookups. */
export type GitRootOptions = {
  /** Working directory to execute the command in. */
  readonly cwd?: t.StringDir;
  /** Optional override for the git binary (default: "git"). */
  readonly bin?: { readonly git?: string };
};

/** Result returned by the git root command. */
export type GitRootResult =
  | { readonly ok: true; readonly bin: { readonly git: string }; readonly root: t.StringDir }
  | {
      readonly ok: false;
      readonly reason: GitRootFailReason;
      readonly hint: string;
      readonly error?: unknown;
    };

/** Failure reasons for git root detection. */
export type GitRootFailReason = 'missing-git' | 'not-a-repo' | 'spawn-failed' | 'parse-failed';
