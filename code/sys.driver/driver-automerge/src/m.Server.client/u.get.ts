import { type t, Err, Http, Is, Pkg } from './common.ts';
import { elapsedSince } from './u.ts';

export const get: t.SyncServerInfoLib['get'] = async (url) => {
  const t0 = performance.now();
  const http = Http.fetcher();
  const result: t.DeepMutable<t.SyncServerInfoResponse> = {
    url,
    data: { pkg: Pkg.unknown(), total: { peers: 0 } },
    elapsed: -1,
    errors: [],
  };

  const pushError = (msg: string) => result.errors.push(Err.std(msg));

  try {
    const res = await http.json<t.SyncServerInfo>(url);

    if (res.error) {
      result.errors.push(res.error);
    } else if (res.ok) {
      const data = (Is.record(res.data) ? res.data : {}) as t.SyncServerInfo;

      if (Pkg.Is.pkg(data.pkg)) result.data.pkg = data.pkg;
      else pushError('Invalid or missing "pkg" in response.');

      if (Is.record(data.total)) result.data.total = data.total;
      else pushError('Invalid or missing "total" in response.');
    } else {
      pushError('HTTP request failed.');
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
