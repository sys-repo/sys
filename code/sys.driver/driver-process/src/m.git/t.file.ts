import type { t } from './common.ts';

/** Read a file blob from a Git object/ref, eg `HEAD:path/to/file`. */
export type GitFileAtRefFn = (opts: GitFileAtRefOptions) => Promise<GitFileAtRefResult>;

/** Options for reading a repository file at a Git ref. */
export type GitFileAtRefOptions = {
  /** Git ref/object to read from. Defaults to `HEAD`. */
  readonly ref?: string;
  /** Repository-relative path to read from the ref. */
  readonly path: string;
  /** Working directory to execute the command in. */
  readonly cwd?: string;
  /** Optional override for the git binary (default: "git"). */
  readonly bin?: { readonly git?: string };
};

/** Result returned by reading a Git file at a ref. */
export type GitFileAtRefResult =
  | { readonly ok: true; readonly bytes: Uint8Array; readonly text: string }
  | { readonly ok: false; readonly reason: GitFileAtRefFailReason; readonly error?: unknown };

/** Failure reasons for reading a Git file at a ref. */
export type GitFileAtRefFailReason = t.GitFailReason | 'not-found';
