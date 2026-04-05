import { type t, Err, Http, SlcMounts, Url } from './common.ts';

const FILE = 'mounts.json' as const;

export const loadMounts: t.SlcDataClient.Mounts.Load = async (origin) => {
  const fetch = Http.fetcher();
  const url = Url.parse(origin).join(FILE) as t.StringUrl;
  const res = await fetch.json<unknown>(url);

  if (!res.ok) {
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
