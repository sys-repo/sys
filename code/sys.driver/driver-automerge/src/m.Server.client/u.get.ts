import { type t, Err, Http, Is, Pkg } from './common.ts';
import { elapsedSince } from './u.ts';

type Probe = { pkg?: string };

export const get: t.SyncServerInfoLib['get'] = async (url) => {
  const t0 = performance.now();
  const http = Http.fetcher();
  const result: t.DeepMutable<t.SyncServerInfo> = {
    url,
    pkg: Pkg.unknown(),
    elapsed: -1,
    errors: [],
  };

  try {
    const res = await http.json<Probe>(url);

    if (res.error) {
      result.errors.push(res.error);
    } else if (res.ok) {
      const v = res.data?.pkg;
      if (Is.string(v) && v.trim().length > 0) {
        result.pkg = Pkg.toPkg(v);
      } else {
        result.errors.push(Err.std('Invalid or missing "pkg" in response.'));
      }
    } else {
      result.errors.push(Err.std('HTTP request failed.'));
    }
  } catch (err) {
    // Catch thrown network/parse errors too.
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(Err.std(msg));
  }

  // Finish up.
  result.elapsed = elapsedSince(t0);
  return result;
};
