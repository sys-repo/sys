import type { t } from '../common.ts';

/** Internal GitHub repository source-domain shapes. */
export declare namespace GithubSource {
  export type RepoMetadata = {
    readonly defaultBranch: string;
  };

  export type RepoCommit = {
    readonly sha: string;
    readonly treeSha: string;
  };

  export type RepoTreeEntryType = string;

  export type RepoTreeEntry = {
    readonly path: t.StringPath;
    readonly mode?: string;
    readonly type: RepoTreeEntryType;
    readonly sha?: string;
    readonly size?: number;
  };

  export type RepoTree = {
    readonly sha: string;
    readonly truncated: boolean;
    readonly entries: readonly RepoTreeEntry[];
  };

  export type RepoResolvedEntry = {
    readonly relativePath: t.StringRelativePath;
    readonly sha: string;
    readonly size?: number;
  };

  export type RepoResolved = {
    readonly repo: string;
    readonly ref: string;
    readonly commit: string;
    readonly tree: string;
    readonly path?: string;
    readonly entries: readonly RepoResolvedEntry[];
  };

  export type RepoResolveResult =
    | { readonly ok: true; readonly data: RepoResolved }
    | { readonly ok: false; readonly error: string };
}
