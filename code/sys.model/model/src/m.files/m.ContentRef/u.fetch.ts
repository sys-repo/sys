import { Dispose, Is, type t } from './common.ts';
import { fetchFailed, fetchUnavailable, httpFailure } from './u.error.ts';

/** Fetch the bytes behind a URL content ref. */
export async function fetchBytes(
  ref: t.Files.ContentRef.Url,
  options: t.Files.ContentRef.Options,
): Promise<Uint8Array> {
  const fetcher = resolveFetch(options.fetch, ref.path);
  const abortable = options.until === undefined ? undefined : Dispose.abortable(options.until);

  try {
    const signal = mergedSignal(options.signal, abortable?.signal);
    const response = await fetchResponse(ref, fetcher, signal);
    return new Uint8Array(await response.arrayBuffer());
  } catch (cause) {
    if (Is.error(cause) && cause.name.startsWith('FilesContentRefError.')) throw cause;
    throw fetchFailed(ref.path, cause);
  } finally {
    abortable?.dispose('Files.ContentRef.bytes.done');
  }
}

/**
 * Helpers:
 */
async function fetchResponse(
  ref: t.Files.ContentRef.Url,
  fetcher: t.Fetch,
  signal?: AbortSignal,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetcher(ref.url, signal === undefined ? undefined : { signal });
  } catch (cause) {
    throw fetchFailed(ref.path, cause);
  }

  if (!Is.statusOK(response.status)) throw httpFailure(ref.path, response);
  return response;
}

function resolveFetch(fetcher: t.Fetch | undefined, path: t.Files.String.Path): t.Fetch {
  if (fetcher) return fetcher;
  if (Is.func(globalThis.fetch)) return globalThis.fetch.bind(globalThis);
  throw fetchUnavailable(path);
}

function mergedSignal(signal?: AbortSignal, until?: AbortSignal): AbortSignal | undefined {
  if (signal && until) return AbortSignal.any([signal, until]);
  return signal ?? until;
}
