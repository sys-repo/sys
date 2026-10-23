import { Env, Fetch, Json, type t } from './common.ts';

const API_ORIGIN = 'https://api.github.com' as t.StringUrl;
const SOURCE_ORIGINS = [
  API_ORIGIN,
  'https://objects.githubusercontent.com',
  'https://release-assets.githubusercontent.com',
  'https://raw.githubusercontent.com',
] as const satisfies readonly t.StringUrl[];

const RepoNamePattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export type GithubRepoRef = {
  readonly owner: string;
  readonly repo: string;
};

export type GithubClientFailure = {
  readonly ok: false;
  readonly kind: 'source-failure' | 'limit-exceeded' | 'cancelled';
  readonly error: string;
};

export type GithubClientResult<T> = { readonly ok: true; readonly data: T } | GithubClientFailure;

export type GithubClient = {
  readonly metadata: (path: string) => Promise<GithubClientResult<unknown>>;
  readonly download: (
    path: string,
    accept: string,
    maxBytes: t.NumberBytes,
  ) => Promise<GithubClientResult<Uint8Array>>;
};

export function parseGithubRepo(value: string): GithubRepoRef {
  const raw = value;
  const [owner, repo] = raw.split('/') as [string, string];
  if (
    !RepoNamePattern.test(raw) ||
    owner === '.' ||
    owner === '..' ||
    repo === '.' ||
    repo === '..'
  ) {
    throw new Error(`Invalid GitHub repository format: "${value}" (expected "owner/repo")`);
  }
  return { owner, repo };
}

export async function loadGithubToken(
  args: { cwd?: t.StringDir } = {},
): Promise<string | undefined> {
  const env = await Env.load({ cwd: args.cwd, search: 'upward' });
  const token = env.get('GH_TOKEN') || env.get('GITHUB_TOKEN');
  return token.trim() || undefined;
}

export function createGithubClient(args: {
  readonly limits: t.GithubPull.Limits;
  readonly token?: string;
  readonly until: AbortSignal;
}): GithubClient {
  const { limits, until } = args;
  const token = args.token?.trim();
  let metadataBytes = 0;

  const invoke = async (
    path: string,
    accept: string,
    maxBytes: number,
  ): Promise<GithubClientResult<Blob>> => {
    const url = apiUrl(path);
    const headers = new Headers({
      accept,
      'x-github-api-version': '2022-11-28',
    });
    if (token) headers.set('authorization', `Bearer ${token}`);

    const fetch = Fetch.make({
      policy: {
        maxBytes,
        timeout: limits.totalTime,
        maxRedirects: 5,
        progressInterval: 250,
        sourceOrigins: SOURCE_ORIGINS,
        credentialOrigins: [API_ORIGIN],
      },
      until,
    });

    try {
      const response = await fetch.blob(url, { headers });
      if (!response.ok) return fromFetchFailure(response);
      return { ok: true, data: response.data };
    } finally {
      fetch.dispose('github-pull.request.complete');
    }
  };

  return {
    async metadata(path) {
      const remaining = limits.metadataBytes - metadataBytes;
      if (remaining <= 0) return limitFailure();

      const response = await invoke(path, 'application/vnd.github+json', remaining);
      if (!response.ok) return response;
      metadataBytes += response.data.size;

      try {
        const text = await response.data.text();
        if (until.aborted) return cancelledFailure();
        return { ok: true, data: Json.parse<unknown>(text) };
      } catch {
        return { ok: false, kind: 'source-failure', error: 'GitHub metadata is malformed.' };
      }
    },

    async download(path, accept, maxBytes) {
      const response = await invoke(path, accept, Math.min(limits.fileBytes, maxBytes));
      if (!response.ok) return response;
      const data = new Uint8Array(await response.data.arrayBuffer());
      if (until.aborted) return cancelledFailure();
      return { ok: true, data };
    },
  };
}

function apiUrl(path: string): t.StringUrl {
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}` as t.StringUrl;
}

function fromFetchFailure(response: t.HttpFetch.ResponseFailure): GithubClientFailure {
  if (response.status === 499) return cancelledFailure();
  if (response.error.policyFailure === 'response-too-large') return limitFailure();
  if (response.status === 401 || response.status === 403) {
    return { ok: false, kind: 'source-failure', error: 'GitHub access denied.' };
  }
  if (response.status === 404) {
    return { ok: false, kind: 'source-failure', error: 'GitHub source not found.' };
  }
  if (response.status === 429) {
    return { ok: false, kind: 'source-failure', error: 'GitHub API rate limit reached.' };
  }
  return { ok: false, kind: 'source-failure', error: 'GitHub source request failed.' };
}

function cancelledFailure(): GithubClientFailure {
  return { ok: false, kind: 'cancelled', error: 'GitHub pull cancelled.' };
}

function limitFailure(): GithubClientFailure {
  return { ok: false, kind: 'limit-exceeded', error: 'GitHub pull limit exceeded.' };
}
