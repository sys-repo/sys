import { Octokit } from '@octokit/rest';
import { Env, Is, type t } from './common.ts';

type GithubRepoRef = {
  readonly owner: string;
  readonly repo: string;
};

const RepoNamePattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function parseGithubRepo(value: string): GithubRepoRef {
  const raw = value.trim();
  if (!RepoNamePattern.test(raw)) {
    throw new Error(`Invalid GitHub repository format: "${value}" (expected "owner/repo")`);
  }
  const [owner, repo] = raw.split('/') as [string, string];
  return { owner, repo };
}

export async function loadGithubToken(
  args: { cwd?: t.StringDir } = {},
): Promise<string | undefined> {
  const env = await Env.load({ cwd: args.cwd, search: 'upward' });
  const token = env.get('GH_TOKEN') || env.get('GITHUB_TOKEN');
  return token.trim() || undefined;
}

export async function listGithubReleases(args: {
  repo: string;
  token?: string;
}): Promise<readonly t.GithubSource.Release[]> {
  const { repo, token } = args;
  const repoRef = parseGithubRepo(repo);
  const octokit = createOctokit(token);
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

export async function getGithubRepositoryMetadata(args: {
  repo: string;
  token?: string;
}): Promise<t.GithubSource.RepoMetadata> {
  const repoRef = parseGithubRepo(args.repo);
  const octokit = createOctokit(args.token);
  const res = await octokit.rest.repos.get({ owner: repoRef.owner, repo: repoRef.repo });
  const defaultBranch = String(res.data.default_branch ?? '').trim();
  if (!defaultBranch) {
    throw new Error(`GitHub repository default branch could not be resolved: ${args.repo}`);
  }
  return { defaultBranch };
}

export async function getGithubCommit(args: {
  repo: string;
  ref: string;
  token?: string;
}): Promise<t.GithubSource.RepoCommit> {
  const repoRef = parseGithubRepo(args.repo);
  const ref = args.ref.trim();
  if (!ref) throw new Error(`GitHub ref is empty for repository: ${args.repo}`);

  const octokit = createOctokit(args.token);
  const res = await octokit.rest.repos.getCommit({
    owner: repoRef.owner,
    repo: repoRef.repo,
    ref,
  });
  const sha = String(res.data.sha ?? '').trim();
  const treeSha = String(res.data.commit?.tree?.sha ?? '').trim();
  if (!sha || !treeSha) {
    throw new Error(`GitHub ref could not be resolved to a commit tree: ${args.repo}@${ref}`);
  }
  return { sha, treeSha };
}

export async function getGithubTree(args: {
  repo: string;
  treeSha: string;
  token?: string;
}): Promise<t.GithubSource.RepoTree> {
  const repoRef = parseGithubRepo(args.repo);
  const octokit = createOctokit(args.token);
  const res = await octokit.rest.git.getTree({
    owner: repoRef.owner,
    repo: repoRef.repo,
    tree_sha: args.treeSha,
    recursive: '1',
  });

  return {
    sha: String(res.data.sha ?? args.treeSha),
    truncated: res.data.truncated === true,
    entries: res.data.tree.map((entry) => ({
      path: String(entry.path ?? '') as t.StringPath,
      mode: entry.mode,
      type: String(entry.type ?? ''),
      sha: entry.sha,
      size: entry.size,
      url: entry.url ? entry.url as t.StringUrl : undefined,
    })),
  };
}

export async function downloadGithubBlob(args: {
  repo: string;
  sha: string;
  token?: string;
}): Promise<Uint8Array> {
  const repoRef = parseGithubRepo(args.repo);
  const octokit = createOctokit(args.token);
  const res = await octokit.rest.git.getBlob({
    owner: repoRef.owner,
    repo: repoRef.repo,
    file_sha: args.sha,
  });

  const encoding = String(res.data.encoding ?? '').toLowerCase();
  if (encoding !== 'base64') {
    throw new Error(`GitHub blob API returned unsupported encoding: ${encoding || '(none)'}`);
  }

  return decodeBase64Bytes(String(res.data.content ?? ''));
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

export async function downloadGithubAssetById(args: {
  repo: string;
  assetId: number;
  token?: string;
}): Promise<Uint8Array> {
  const { repo, assetId, token } = args;
  const repoRef = parseGithubRepo(repo);
  const octokit = createOctokit(token);
  const res = await octokit.rest.repos.getReleaseAsset({
    owner: repoRef.owner,
    repo: repoRef.repo,
    asset_id: assetId,
    headers: { accept: 'application/octet-stream' },
  });

  return await bytesFromUnknown(res.data);
}

async function bytesFromUnknown(input: unknown): Promise<Uint8Array> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (typeof input === 'string') return bytesFromBinaryString(input);
  if (input instanceof Blob) return new Uint8Array(await input.arrayBuffer());

  if (input && typeof input === 'object') {
    const maybe = input as { arrayBuffer?: unknown };
    if (typeof maybe.arrayBuffer === 'function') {
      const arrayBuffer = await (maybe as { arrayBuffer: () => Promise<ArrayBuffer> })
        .arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
  }

  throw new Error('GitHub release asset API returned unsupported binary payload.');
}

function bytesFromBinaryString(input: string): Uint8Array {
  const bytes = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    bytes[i] = input.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function decodeBase64Bytes(input: string): Uint8Array {
  const clean = input.replace(/\s+/g, '');
  if (!clean) return new Uint8Array();
  return bytesFromBinaryString(atob(clean));
}

const SilentOctokitLog = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

function createOctokit(token?: string): t.GithubOctokit.Client {
  const auth = token?.trim();
  return new Octokit(auth ? { auth, log: SilentOctokitLog } : { log: SilentOctokitLog });
}
