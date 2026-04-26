import type { t } from './common.ts';

/** Initialize a Git repository in the target working directory. */
export type GitInitFn = (opts?: GitInitOptions) => Promise<GitInitResult>;

/** Options for running `git init`. */
export type GitInitOptions = {
  /** Working directory to execute the command in. */
  readonly cwd?: t.StringDir;
  /** Optional override for the git binary (default: "git"). */
  readonly bin?: { readonly git?: string };
};

/** Result returned by the git init command. */
export type GitInitResult =
  | {
      readonly ok: true;
      readonly bin: { readonly git: string };
      readonly cwd: t.StringDir;
    }
  | {
      readonly ok: false;
      readonly reason: GitInitFailReason;
      readonly hint: string;
      readonly error?: unknown;
    };

/** Failure reasons for git init. */
export type GitInitFailReason = 'missing-git' | 'spawn-failed';
