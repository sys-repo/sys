import { Octokit } from '@octokit/rest';
import { type t, Env, Is } from '../common.ts';

type OctokitLike = {
  readonly rest: {
    readonly repos: {
      listReleases(args: { owner: string; repo: string; per_page?: number }): Promise<{
        data: Array<{
          tag_name: string;
          draft?: boolean;
          prerelease?: boolean;
          assets: Array<{ id: number; name: string; browser_download_url: string }>;
        }>;
      }>;
    };
  };
};

export type GithubRepoRef = {
  readonly owner: string;
  readonly repo: string;
};

export function parseGithubRepo(value: string): GithubRepoRef {
  const raw = value.trim();
  const parts = raw.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid GitHub repository format: "${value}" (expected "owner/repo")`);
  }
  return { owner: parts[0], repo: parts[1] };
}

export async function loadGithubToken(): Promise<string | undefined> {
  const env = await Env.load({ search: 'upward' });
  const token = env.get('GH_TOKEN') || env.get('GITHUB_TOKEN');
  return token.trim() || undefined;
}

export async function listGithubReleases(args: {
  repo: string;
  token?: string;
}): Promise<readonly t.PullTool.GithubRelease[]> {
  const { repo, token } = args;
  const repoRef = parseGithubRepo(repo);
  const octokit = await createOctokit(token);
  const res = await octokit.rest.repos.listReleases({
    owner: repoRef.owner,
    repo: repoRef.repo,
    per_page: 100,
  });

  return res.data.map((item) => ({
    tag: item.tag_name,
    draft: item.draft,
    prerelease: item.prerelease,
    assets: item.assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      downloadUrl: asset.browser_download_url as t.StringUrl,
    })),
  }));
}

export async function downloadGithubAsset(args: {
  url: t.StringUrl;
  token?: string;
}): Promise<Uint8Array> {
  const headers = new Headers();
  if (Is.str(args.token) && args.token.trim()) {
    headers.set('Authorization', `Bearer ${args.token.trim()}`);
  }
  headers.set('Accept', 'application/octet-stream');

  const res = await fetch(args.url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub asset download failed (${res.status} ${res.statusText})`);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!bytes.byteLength) {
    throw new Error('GitHub asset download returned empty content.');
  }
  return bytes;
}

async function createOctokit(token?: string): Promise<OctokitLike> {
  const OctokitCtor = Octokit as new (args?: { auth?: string }) => OctokitLike;
  return new OctokitCtor({ auth: token });
}
