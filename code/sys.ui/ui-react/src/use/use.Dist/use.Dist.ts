import { Http } from '@sys/http/client';
import { useEffect, useState } from 'react';
import { Err, Pkg, type t } from '../common.ts';

type Observation = {
  readonly count: number;
  readonly sample: boolean;
  readonly json?: t.DistPkg;
  readonly error?: t.StdError;
};

/**
 * Observe a supported `dist.json` shape; neither the declared digest nor payload is authenticated.
 */
export const useDist: t.UseDistFactory = (options) => useDistWith(options);

const loadDefaultSample = async (): Promise<t.DistPkg> =>
  (await import('./use.Dist.sample.ts')).sample;

/** Package-internal loader seam for deterministic disposal during sample acquisition. */
export function useDistWith(
  options: Parameters<t.UseDistFactory>[0] = {},
  loadSample: () => Promise<t.DistPkg> = loadDefaultSample,
): t.DistHook {
  const { sampleFallback = false } = options;
  const [observation, setObservation] = useState<Observation>({ count: 0, sample: false });

  /**
   * Effect: Fetch JSON (or optionally load sample data).
   */
  useEffect(() => {
    const url = new URL('./dist.json', globalThis.location.href);
    const fetch = Http.fetcher({
      policy: {
        maxBytes: 16 * 1024 * 1024,
        timeout: 30_000,
        maxRedirects: 3,
        progressInterval: 100,
        sourceOrigins: [url.origin],
        credentialOrigins: [],
      },
    });

    const update = (json?: t.DistPkg, error?: t.StdError, sample = false) => {
      setObservation(({ count }) => ({
        count: count + (json ? 1 : 0),
        json,
        error,
        sample,
      }));
    };

    const load = async () => {
      setObservation(({ count }) => ({ count, sample: false }));
      let error: t.StdError;
      try {
        const res = await fetch.json<unknown>(url.href);
        if (fetch.disposed) return;
        if (res.ok && Pkg.Is.dist(res.data)) {
          update(res.data);
          return;
        }
        error = Err.std(res.ok ? 'Invalid Dist observation.' : res.error);
      } catch (cause) {
        if (fetch.disposed) return;
        error = Err.std(cause);
      }

      update(undefined, error);
      if (fetch.disposed || !sampleFallback) return;
      try {
        const sample = await loadSample();
        if (!fetch.disposed) update(sample, error, true);
      } catch (cause) {
        if (!fetch.disposed) update(undefined, Err.std(cause));
      }
    };

    void load();
    return fetch.dispose;
  }, [sampleFallback, loadSample]);

  /**
   * API
   */
  const api: t.DistHook = {
    count: observation.count,
    is: { sample: observation.sample },
    error: observation.error,
    json: observation.json,
    toString() {
      const json = api.json;
      if (!json) return '(not found)';
      const { name, version } = json.pkg ?? Pkg.toPkg(json.build.builder);
      const hx = json.hash.digest.slice(-5);
      return `${name}@${version}-${hx}`;
    },
  };
  return api;
}
