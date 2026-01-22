import { type t, SlugSchema, Http, Url } from './common.ts';
import { SlugUrl } from './m.Url.ts';

export const loadTree: t.SlugClientTreeLib['load'] = async (baseUrl, docid, init = {}) => {
  const fetch = Http.fetcher();
  const base = Url.parse(baseUrl);
  const manifestUrl = base.join('manifests', `slug-tree.${SlugUrl.clean(docid)}.json`);
  const res = await fetch.json<unknown>(manifestUrl, { cache: 'no-cache', ...init });

  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `Slug-tree manifest fetch failed. ${res.status} ${res.statusText} @ ${manifestUrl}`,
        status: res.status,
        statusText: res.statusText,
        url: manifestUrl,
      },
    };
  }

  const parsed = SlugSchema.Tree.validate(res.data);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Slug-tree validation failed. ${parsed.error.message}`,
      },
    };
  }

  return {
    ok: true,
    value: parsed.sequence,
  };
};
