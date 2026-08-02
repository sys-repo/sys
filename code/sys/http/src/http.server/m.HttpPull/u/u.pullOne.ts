import { Err, Fs, Path, type t, Url } from '../common.ts';
import { isAbortError } from './u.abort.ts';
import { fetchBytes } from './u.fetch.ts';

/** Pull one legacy URL to its precomputed path, preserving overwrite compatibility. */
export async function pullOne(
  url: t.StringUrl,
  target: t.StringPath,
  client: t.HttpFetch.Instance,
  opts: {
    readonly signal?: AbortSignal;
    readonly retry?: t.HttpPull.Options['retry'];
  },
): Promise<t.HttpPull.Record> {
  const { signal } = opts;
  const u = Url.parse(url);

  if (!u.ok) {
    return { ok: false, error: 'Invalid URL', path: { source: url, target } };
  }

  try {
    throwIfAborted(signal);
    await Fs.ensureDir(Path.dirname(target));
    throwIfAborted(signal);

    const result = await fetchBytes(u.toURL(), client, { signal, retry: opts.retry });

    if (!result.ok) {
      return {
        ok: false,
        status: result.status,
        error: result.error,
        path: { source: url, target },
      };
    }

    throwIfAborted(signal);
    await Fs.write(target, result.bytes, { force: true });

    return {
      ok: true,
      status: result.status,
      bytes: result.bytes.byteLength as t.NumberBytes,
      path: { source: url, target },
    };
  } catch (err) {
    if (isAbortError(err)) throw err;
    return {
      ok: false,
      error: Err.normalize(err).message,
      path: { source: url, target },
    };
  }
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}
