import { validateSlugTree } from '../m.slug.schema/mod.ts';
import { type t, Http, Url } from './common.ts';
import { SlugUrl } from './m.Url.ts';

export const loadTreeFromEndpoint: t.SlugClientLib['loadTreeFromEndpoint'] = async (
  baseUrl,
  docid,
  init = {},
) => {
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

  const parsed = validateSlugTree(res.data);
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
