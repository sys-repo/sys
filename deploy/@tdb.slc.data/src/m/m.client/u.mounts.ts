import { type t, Err, Http, SlcMounts, Url } from './common.ts';

const FILE = 'mounts.json' as const;
const EMPTY: t.SlcMounts.Doc = { mounts: [] };

export const loadMounts: t.SlcDataClient.Mounts.Load = async (origin) => {
  const fetch = Http.fetcher();
  const url = Url.parse(origin).join(FILE) as t.StringUrl;
  const res = await fetch.json<unknown>(url);

  if (!res.ok) {
    if (wrangle.isEmpty(res)) return { ok: true, value: EMPTY };
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `Mount index fetch failed. ${res.status} ${res.statusText} @ ${res.url ?? url}`,
        status: res.status,
        statusText: res.statusText,
        url: res.url ?? url,
      },
    };
  }

  const checked = SlcMounts.validate(res.data);
  if (!checked.ok) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Mount index failed @sys/schema validation. Reason: ${Err.summary(checked.errors)}`,
      },
    };
  }

  return { ok: true, value: res.data as t.SlcMounts.Doc };
};

const wrangle = {
  isEmpty(res: t.FetchResponse<unknown>) {
    const url = res.url ?? '';
    const isMountIndex = url.endsWith('/mounts.json');
    const isLocalhost = url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');
    if (res.status === 404 && isMountIndex) return true;
    if (res.status === 520 && isMountIndex && isLocalhost) return true;
    return false;
  },
} as const;
