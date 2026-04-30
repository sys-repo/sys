import { type t } from '../common.ts';

/**
 * GitHub source-domain shapes.
 *
 * These types describe data resolved from GitHub itself. Bundle-pull
 * materialization types live under `u.bundle/u.pull.github/t.ts`.
 */
export declare namespace GithubSource {
  export type ReleaseAsset = {
    readonly id: number;
    readonly name: string;
    readonly downloadUrl: t.StringUrl;
  };

  export type Release = {
    readonly tag: string;
    readonly draft?: boolean;
    readonly prerelease?: boolean;
    readonly assets: readonly ReleaseAsset[];
  };

  export type ReleaseResolved = {
    readonly release: Release;
    readonly assets: readonly ReleaseAsset[];
  };

  export type ReleaseResolveResult =
    | { readonly ok: true; readonly data: ReleaseResolved }
    | { readonly ok: false; readonly error: string };

  export type RepoMetadata = {
    readonly defaultBranch: string;
  };

  export type RepoCommit = {
    readonly sha: string;
    readonly treeSha: string;
  };

  export type RepoTreeEntryType = 'blob' | 'tree' | 'commit' | (string & {});

  export type RepoTreeEntry = {
    readonly path: t.StringPath;
    readonly mode?: string;
    readonly type: RepoTreeEntryType;
    readonly sha?: string;
    readonly size?: number;
    readonly url?: t.StringUrl;
  };

  export type RepoTree = {
    readonly sha: string;
    readonly truncated: boolean;
    readonly entries: readonly RepoTreeEntry[];
  };

  export type RepoResolvedEntry = {
    readonly sourcePath: t.StringPath;
    readonly relativePath: t.StringRelativePath;
    readonly sha: string;
    readonly size?: number;
    readonly url?: t.StringUrl;
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
