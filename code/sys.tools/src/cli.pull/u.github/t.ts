import type { t } from '../common.ts';

export type PullToolGithubReleaseAsset = {
  readonly id: number;
  readonly name: string;
  readonly downloadUrl: t.StringUrl;
};

export type PullToolGithubRelease = {
  readonly tag: string;
  readonly draft?: boolean;
  readonly prerelease?: boolean;
  readonly assets: readonly PullToolGithubReleaseAsset[];
};

export type PullToolGithubReleaseResolved = {
  readonly release: PullToolGithubRelease;
  readonly assets: readonly PullToolGithubReleaseAsset[];
};

export type PullToolGithubReleaseResolveResult =
  | { readonly ok: true; readonly data: PullToolGithubReleaseResolved }
  | { readonly ok: false; readonly error: string };
