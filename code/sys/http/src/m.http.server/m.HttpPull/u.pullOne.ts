import { type t, Fs, HttpClient, Path } from './common.ts';
import { PullMap } from './u.map.ts';
import { isAbortError, resolveTarget } from './u.ts';

export async function pullOne(
  url: string,
  dir: t.StringDir,
  client: t.HttpFetch,
  map?: t.HttpPullMapOptions,
  signal?: AbortSignal, // ← added
): Promise<t.HttpPullRecord> {
  let u: URL | undefined;
  let target: t.StringPath | undefined;

  try {
    u = new URL(url);
  } catch {
    const target = resolveTarget(url, dir, map);
    return { ok: false, error: 'Invalid URL', path: { source: url, target } };
  }

  try {
    const rel = PullMap.urlToPath(u, map);
    target = Fs.join(dir, rel);

    await Fs.ensureDir(Path.dirname(target));

    // Pass signal to the underlying fetch; typed loosely to avoid reshaping your client type.
    const res = await (client as any).blob(u.toString(), { signal });
    if (!res.ok || !res.data) {
      return {
        ok: false,
        status: res.status as t.HttpStatusCode | undefined,
        error: res.error?.message ?? (res.status ? `HTTP ${res.status}` : 'Network error'),
        path: { source: url, target },
      };
    }

    const bytes = await HttpClient.toUint8Array(res.data);
    await Fs.write(target, bytes, { force: true });

    return {
      ok: true,
      status: res.status as t.HttpStatusCode | undefined,
      bytes: bytes.byteLength as t.NumberBytes,
      path: { source: url, target },
    };
  } catch (err) {
    // Important: let aborts bubble to be handled as cancellation upstream.
    if (isAbortError(err)) throw err;

    const fallback = target ?? (Fs.join(dir, PullMap.urlToPath(u!)) as t.StringPath);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      path: { source: url, target: fallback },
    };
  }
}
