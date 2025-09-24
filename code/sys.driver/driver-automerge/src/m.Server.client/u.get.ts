import { type t, Err, Http, Pkg } from './common.ts';
import { elapsedSince } from './u.ts';

export const get: t.SyncServerInfoLib['get'] = async (url) => {
  const t0 = performance.now();
  const http = Http.fetcher();
  const result: t.DeepMutable<t.SyncServerInfoResponse> = {
    url,
    pkg: Pkg.unknown(),
    elapsed: -1,
    errors: [],
  };

  try {
    const res = await http.json<t.SyncServerInfo>(url);

    if (res.error) {
      result.errors.push(res.error);
    } else if (res.ok) {
      const pkg = res.data?.pkg;
      if (Pkg.Is.pkg(pkg)) {
        result.pkg = pkg;
      } else {
        result.errors.push(Err.std('Invalid or missing "pkg" in response.'));
      }
    } else {
      result.errors.push(Err.std('HTTP request failed.'));
    }
  } catch (err) {
    // Catch thrown network/parse errors.
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(Err.std(msg));
  }

  // Finish up.
  result.elapsed = elapsedSince(t0);
  return result;
};
