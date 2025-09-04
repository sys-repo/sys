import { type t, Fs, HttpClient, Path } from './common.ts';
import { PullMap } from './u.Map.ts';
import { sanitizeForFilename, semaphore } from './u.ts';

export const toDir: t.HttpPullLib['toDir'] = async (urls, dir, opts = {}) => {
  const client = opts.client ?? HttpClient.fetcher();
  const concurrency = Math.max(1, opts?.concurrency ?? 8);
  const lim = semaphore(concurrency);
  const tasks = urls.map((url) => lim(() => pullOne(url, dir, client, opts?.map)));
  const results = await Promise.all(tasks);
  return results as readonly t.HttpPullRecord[];
};

/**
 * One URL → one file write → one record.
 */
async function pullOne(
  url: t.StringUrl,
  dir: t.StringDir,
  client: t.HttpFetch,
  map?: t.HttpPullMapOptions,
): Promise<t.HttpPullRecord> {
  let u: URL | undefined;
  let target: t.StringPath | undefined;

  // Parse URL (or surface a clear error + safe
  try {
    u = new URL(url);
  } catch {
    const safe = sanitizeForFilename(url);
    target = Fs.join(dir, safe);
    return {
      ok: false,
      path: { source: url, target },
      error: 'Invalid URL',
    };
  }

  try {
    const rel = PullMap.urlToPath(u, map);
    target = Fs.join(dir, rel);

    // Ensure parent directory exists.
    await Fs.ensureDir(Path.dirname(target) as t.StringDir);

    // Binary fetch (content-type agnostic):
    const res = await client.blob(u.toString());
    if (!res.ok || !res.data) {
      return {
        ok: false,
        path: { source: url, target },
        status: res.status,
        error: res.error?.message ?? (res.status ? `HTTP ${res.status}` : 'Network error'),
      };
    }

    const bytes = await HttpClient.toUint8Array(res.data);
    await Fs.write(target, bytes, { force: true });

    return {
      ok: true,
      path: { source: url, target },
      status: res.status,
      bytes: bytes.byteLength,
    };
  } catch (err) {
    // Any unexpected failure during fetch/write.
    const fallback = target ?? Fs.join(dir, PullMap.urlToPath(u));
    return {
      ok: false,
      path: { source: url, target: fallback },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
