import { Fs, type t, WebFixture } from '../../../-test.ts';

export const LIMITS: t.GithubPull.Limits = {
  metadataBytes: 256_000,
  entries: 100,
  fileBytes: 1_000_000,
  totalBytes: 5_000_000,
  totalTime: 5_000,
};

export type FetchCall = {
  readonly url: URL;
  readonly headers: Headers;
  readonly signal: AbortSignal;
};

export async function usingGithubFetch<T>(
  route: (call: FetchCall) => Response | Promise<Response>,
  run: (calls: FetchCall[]) => Promise<T>,
): Promise<T> {
  const calls: FetchCall[] = [];
  const mock = WebFixture.Fetch.mock(async (input, init) => {
    const request = new Request(input, init);
    const call = {
      url: new URL(request.url),
      headers: request.headers,
      signal: request.signal,
    };
    calls.push(call);
    return await route(call);
  });

  try {
    return await run(calls);
  } finally {
    mock.dispose();
  }
}

export function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(value), { ...init, headers });
}

export function release(assets: readonly { id: number; name: string; body: string }[]) {
  return {
    tag_name: 'v1.2.3',
    assets: assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      size: new TextEncoder().encode(asset.body).byteLength,
    })),
  };
}

export async function withTmpDir<T>(run: (dir: t.StringDir) => Promise<T>): Promise<T> {
  const dir = await Deno.makeTempDir({
    dir: Deno.cwd(),
    prefix: '.tmp-sys-tools-github-pull-',
  }) as t.StringDir;
  try {
    return await run(dir);
  } finally {
    await Fs.remove(dir);
  }
}

export function abortablePending(signal: AbortSignal): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}
